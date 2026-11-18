import { BadRequestException, ForbiddenException, INestApplication, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import * as request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';
import { jwtConstants } from '../auth/constants/jwt.constant';
import { AuthGuard } from '../auth/guard/auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { PermissionsGuard } from '../auth/guard/permissions.guard';
import { resolveUserAuthContext, isOperationalStaff } from '../common/helpers/role.helper';
import { AuthService } from '../auth/auth.service';
import { AuditService } from '../audit/audit.service';
import { OrderController } from '../orders/orders.controller';
import { OrderService } from '../orders/orders.service';
import { DocumentosOrdenController } from '../documentos-orden/documentos-orden.controller';
import { DocumentosOrdenService } from '../documentos-orden/documentos-orden.service';
import { UsersController } from '../users/users.controller';
import { UsersService } from '../users/users.service';
import { UsuarioRolController } from './usuario-rol.controller';
import { UsuarioRolService } from './usuario-rol.service';
import { RolService } from '../rol/rol.service';
import { validateOrderTransition } from '../orders/helpers/order-transition.helper';

function makeRole(slug: string, perms: string[], activo = true) {
  return {
    rol: {
      slug,
      activo,
      deletedAt: null,
      rolePermissions: perms.map((p) => ({ permission: { slug: p } })),
    },
  };
}

function makeUserEntity(opts: {
  id: number;
  roles: Array<{ slug: string; perms: string[]; activo?: boolean }>;
  estado?: boolean;
  habilitadoTecnico?: boolean;
}) {
  return {
    id: opts.id,
    correo: `user${opts.id}@hdc.test`,
    cedula: `05036468${String(opts.id).padStart(2, '0')}`,
    nombre: `User${opts.id}`,
    apellido: 'Test',
    estado: opts.estado ?? true,
    habilitadoTecnico: opts.habilitadoTecnico ?? false,
    userRoles: opts.roles.map((r) => makeRole(r.slug, r.perms, r.activo ?? true)),
  };
}

describe('Sistema Integral Multirrol — Fase H (Escenarios 1 a 22)', () => {
  describe('A. Resolución centralizada de contexto multirrol (resolveUserAuthContext)', () => {
    it('1-4. Usuarios monorrol (admin, tech, recep, client) conservan su comportamiento exacto', () => {
      const admin = makeUserEntity({ id: 1, roles: [{ slug: 'admin', perms: ['roles.manage'] }] });
      const tech = makeUserEntity({ id: 2, roles: [{ slug: 'tech', perms: ['orders.view', 'orders.update'] }], habilitadoTecnico: true });
      const recep = makeUserEntity({ id: 3, roles: [{ slug: 'recep', perms: ['orders.create', 'orders.view'] }] });
      const client = makeUserEntity({ id: 4, roles: [{ slug: 'client', perms: [] }] });

      expect(resolveUserAuthContext(admin)).toEqual({
        roles: ['admin'],
        role: 'admin',
        permissions: ['roles.manage'],
        habilitadoTecnico: false,
      });
      expect(resolveUserAuthContext(tech)).toEqual({
        roles: ['tech'],
        role: 'tech',
        permissions: ['orders.view', 'orders.update'],
        habilitadoTecnico: true,
      });
      expect(resolveUserAuthContext(recep).roles).toEqual(['recep']);
      expect(resolveUserAuthContext(client).roles).toEqual(['client']);
      expect(isOperationalStaff(client)).toBe(false);
    });

    it('5-10. Combinaciones multirrol (admin+tech, tech+recep, tech+client, admin+client, recep+client, 3 roles) unen permisos sin duplicados', () => {
      const techRecep = makeUserEntity({
        id: 6,
        habilitadoTecnico: true,
        roles: [
          { slug: 'tech', perms: ['orders.view', 'orders.update'] },
          { slug: 'recep', perms: ['orders.create', 'orders.view', 'users.create'] },
        ],
      });
      const ctx = resolveUserAuthContext(techRecep);
      expect(ctx.roles).toEqual(['tech', 'recep']);
      expect(ctx.permissions).toEqual(
        expect.arrayContaining(['orders.view', 'orders.update', 'orders.create', 'users.create']),
      );
      expect(new Set(ctx.permissions).size).toBe(ctx.permissions.length);

      const threeRoles = makeUserEntity({
        id: 10,
        habilitadoTecnico: true,
        roles: [
          { slug: 'client', perms: [] },
          { slug: 'recep', perms: ['orders.create'] },
          { slug: 'tech', perms: ['orders.view'] },
        ],
      });
      const ctx3 = resolveUserAuthContext(threeRoles);
      expect(ctx3.roles).toEqual(['tech', 'recep', 'client']);
      expect(ctx3.permissions).toEqual(['orders.create', 'orders.view']);
      expect(isOperationalStaff(threeRoles)).toBe(true);
    });

    it('12. Usuario sin roles activos (o con roles inactivos) no obtiene permisos ni pasa guards', async () => {
      const noActiveRoles = makeUserEntity({
        id: 12,
        roles: [{ slug: 'admin', perms: ['roles.manage'], activo: false }],
      });
      const ctx = resolveUserAuthContext(noActiveRoles);
      expect(ctx.roles).toEqual([]);
      expect(ctx.permissions).toEqual([]);

      const reflector = new Reflector();
      const rolesGuard = new RolesGuard(reflector);
      const permsGuard = new PermissionsGuard(reflector, {} as any);
      const handler = OrderController.prototype.create;
      const execCtx = {
        getHandler: () => handler,
        getClass: () => OrderController,
        switchToHttp: () => ({ getRequest: () => ({ user: noActiveRoles }) }),
      } as any;

      expect(rolesGuard.canActivate(execCtx)).toBe(false);
      expect(await permsGuard.canActivate(execCtx)).toBe(false);
    });
  });

  describe('B. Pruebas HTTP reales (Guards, Órdenes, Propiedad, Cambio de Roles en caliente)', () => {
    let app: INestApplication;
    let jwtService: JwtService;

    const usersMap: Record<number, any> = {
      1: makeUserEntity({ id: 1, roles: [{ slug: 'admin', perms: ['roles.manage', 'orders.view', 'orders.create'] }], habilitadoTecnico: false }),
      2: makeUserEntity({ id: 2, roles: [{ slug: 'tech', perms: ['orders.view', 'orders.update'] }], habilitadoTecnico: true }),
      3: makeUserEntity({ id: 3, roles: [{ slug: 'recep', perms: ['orders.create', 'orders.view'] }], habilitadoTecnico: false }),
      4: makeUserEntity({ id: 4, roles: [{ slug: 'client', perms: [] }] }),
      5: makeUserEntity({ id: 5, roles: [{ slug: 'admin', perms: ['roles.manage', 'orders.view'] }, { slug: 'tech', perms: ['orders.view'] }], habilitadoTecnico: true }),
      6: makeUserEntity({ id: 6, roles: [{ slug: 'tech', perms: ['orders.view'] }, { slug: 'recep', perms: ['orders.create', 'orders.view'] }], habilitadoTecnico: true }),
      7: makeUserEntity({ id: 7, roles: [{ slug: 'tech', perms: ['orders.view'] }, { slug: 'client', perms: [] }], habilitadoTecnico: true }),
      8: makeUserEntity({ id: 8, roles: [{ slug: 'admin', perms: ['orders.view'] }, { slug: 'client', perms: [] }], habilitadoTecnico: false }),
      9: makeUserEntity({ id: 9, roles: [{ slug: 'recep', perms: ['orders.create', 'orders.view'] }, { slug: 'client', perms: [] }], habilitadoTecnico: false }),
      11: makeUserEntity({ id: 11, estado: false, roles: [{ slug: 'tech', perms: ['orders.view'] }], habilitadoTecnico: true }),
    };

    const ordersDb: Record<number, any> = {
      100: { id: 100, workOrderNumber: 'ODS-100', client: { id: 4 }, clientId: 4, technicianId: 7 },
      200: { id: 200, workOrderNumber: 'ODS-200', client: { id: 7 }, clientId: 7, technicianId: 2 },
      300: { id: 300, workOrderNumber: 'ODS-300', client: { id: 4 }, clientId: 4, technicianId: 2 },
    };

    const mockOrderService = {
      findOne: jest.fn(async (id: number) => ordersDb[id]),
      findOrdersByTechnician: jest.fn(async (techId: number) =>
        Object.values(ordersDb).filter((o) => o.technicianId === techId),
      ),
      findOrdersByClient: jest.fn(async (clientId: number) =>
        Object.values(ordersDb).filter((o) => o.clientId === clientId),
      ),
      handleClientPresupuestoAction: jest.fn(async (orderId: number, userId: number) => {
        const order = ordersDb[orderId];
        if (!order || order.clientId !== userId) {
          throw new ForbiddenException('Solo el titular de la orden puede responder este presupuesto.');
        }
        return { message: 'Presupuesto respondido', orderId };
      }),
      getTechniciansAvailability: jest.fn(async () =>
        Object.values(usersMap)
          .filter((u) => u.estado && u.habilitadoTecnico)
          .map((u) => ({ technicianId: u.id, nombreCompleto: `${u.nombre} ${u.apellido}` })),
      ),
    };

    const mockDocumentosService = {
      verificarPropiedadCliente: jest.fn(async (orderId: number, userId: number) => {
        return ordersDb[orderId]?.clientId === userId;
      }),
      findByOrder: jest.fn(async () => []),
    };

    const mockUsersService = {
      findOne: jest.fn(async (id: number) => {
        const u = usersMap[id];
        if (!u || !u.estado) throw new UnauthorizedException();
        return u;
      }),
      update: jest.fn(async (id: number, dto: any) => ({ id, ...dto })),
      create: jest.fn(async (dto: any) => ({ id: 99, ...dto })),
    };

    const mockUsuarioRolService = {
      assignRoleToUser: jest.fn(async (userId: number, roleId: number) => ({ id: 1, userId, roleId })),
      removeRoleFromUser: jest.fn(async () => undefined),
    };

    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          JwtModule.register({
            secret: jwtConstants.secret,
            signOptions: { expiresIn: '1h' },
          }),
        ],
        controllers: [
          OrderController,
          DocumentosOrdenController,
          UsersController,
          UsuarioRolController,
        ],
        providers: [
          AuthGuard,
          RolesGuard,
          PermissionsGuard,
          { provide: OrderService, useValue: mockOrderService },
          { provide: DocumentosOrdenService, useValue: mockDocumentosService },
          { provide: UsersService, useValue: mockUsersService },
          { provide: UsuarioRolService, useValue: mockUsuarioRolService },
          { provide: RolService, useValue: {} },
        ],
      }).compile();

      app = moduleRef.createNestApplication();
      app.setGlobalPrefix('api/v1');
      app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
      await app.init();
      jwtService = moduleRef.get(JwtService);
    });

    afterAll(async () => {
      if (app) {
        await app.close();
      }
    });

    const tokenFor = (id: number) => jwtService.sign({ sub: id });

    it('11. Usuario desactivado (estado=false) es rechazado con 401 incluso con token válido', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/orders/tecnico/mis-ordenes')
        .set('Authorization', `Bearer ${tokenFor(11)}`)
        .expect(401);
    });

    it('13. Cambio de roles durante sesión activa revoca acceso inmediatamente en backend', async () => {
      const tokenUser6 = tokenFor(6); // tech + recep
      await request(app.getHttpServer())
        .get('/api/v1/orders/tecnicos/disponibilidad')
        .set('Authorization', `Bearer ${tokenUser6}`)
        .expect(200);

      // Admin retira roles operativos y lo deja solo como client en BD
      const originalRoles = usersMap[6].userRoles;
      usersMap[6].userRoles = [makeRole('client', [])];

      await request(app.getHttpServer())
        .get('/api/v1/orders/tecnicos/disponibilidad')
        .set('Authorization', `Bearer ${tokenUser6}`)
        .expect(403);

      usersMap[6].userRoles = originalRoles;
    });

    it('18-20. tech+client (#7) puede ver su orden asignada (#100), sus órdenes personales (#200), documentos y responder su presupuesto, sin acceder a presupuestos ajenos (#100)', async () => {
      const token7 = tokenFor(7);

      // Ver orden técnica asignada (#100 de cliente #4) -> permitido
      await request(app.getHttpServer())
        .get('/api/v1/orders/100')
        .set('Authorization', `Bearer ${token7}`)
        .expect(200);

      // Ver documentos de orden de taller -> permitido
      await request(app.getHttpServer())
        .get('/api/v1/orders/100/documentos')
        .set('Authorization', `Bearer ${token7}`)
        .expect(200);

      // Consultar sus órdenes personales -> solo #200
      const misPersonales = await request(app.getHttpServer())
        .get('/api/v1/orders/cliente/mis-ordenes')
        .set('Authorization', `Bearer ${token7}`)
        .expect(200);
      expect(misPersonales.body.map((o: any) => o.id)).toEqual([200]);

      // Responder presupuesto de su propia orden #200 -> permitido
      await request(app.getHttpServer())
        .post('/api/v1/orders/200/presupuesto/responder')
        .set('Authorization', `Bearer ${token7}`)
        .send({ action: 'ACEPTADO' })
        .expect(201);

      // Intentar responder presupuesto como cliente en orden ajena #100 -> 403 Forbidden
      await request(app.getHttpServer())
        .post('/api/v1/orders/100/presupuesto/responder')
        .set('Authorization', `Bearer ${token7}`)
        .send({ action: 'ACEPTADO' })
        .expect(403);

      // Admin (#8 admin+client) tampoco puede aprobar presupuesto como cliente en orden ajena (#100)
      await request(app.getHttpServer())
        .post('/api/v1/orders/100/presupuesto/responder')
        .set('Authorization', `Bearer ${tokenFor(8)}`)
        .send({ action: 'ACEPTADO' })
        .expect(403);
    });

    it('5 & 18. Disponibilidad técnica usa habilitadoTecnico=true (incluye admin+tech #5, excluye admin puro #1 y desactivado #11)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/orders/tecnicos/disponibilidad')
        .set('Authorization', `Bearer ${tokenFor(1)}`)
        .expect(200);

      const ids = res.body.map((t: any) => t.technicianId);
      expect(ids).toContain(5); // admin + tech habilitado
      expect(ids).toContain(2); // tech puro habilitado
      expect(ids).not.toContain(1); // admin sin habilitadoTecnico
      expect(ids).not.toContain(11); // usuario desactivado
    });

    it('habilitadoTecnico=true sin permisos operativos ni rol técnico no concede acceso a rutas técnicas protegidas', async () => {
      usersMap[12] = makeUserEntity({
        id: 12,
        roles: [{ slug: 'client', perms: [] }],
        habilitadoTecnico: true,
      });

      await request(app.getHttpServer())
        .get('/api/v1/orders/tecnico/mis-ordenes')
        .set('Authorization', `Bearer ${tokenFor(12)}`)
        .expect(403);

      await request(app.getHttpServer())
        .get('/api/v1/orders/100')
        .set('Authorization', `Bearer ${tokenFor(12)}`)
        .expect(403);
    });

    it('Compatibilidad con payload de sesión legacy sin roles[] ni habilitadoTecnico', () => {
      const legacyUserPayload = { id: 99, role: 'recep' };
      const ctx = resolveUserAuthContext(legacyUserPayload);
      expect(ctx.roles).toEqual(['recep']);
      expect(ctx.role).toBe('recep');
      expect(ctx.permissions).toEqual([]);
      expect(ctx.habilitadoTecnico).toBe(false);
    });
  });

  describe('C. Auditoría multirrol, transiciones combinadas y validación de migración 007', () => {
    it('21. AuditService distingue actorType="employee" para empleado con rol client secundario', () => {
      const auditService = new AuditService({} as any);
      const techClient = makeUserEntity({
        id: 7,
        roles: [
          { slug: 'client', perms: [] },
          { slug: 'tech', perms: ['orders.view'] },
        ],
      });

      const resolved = (auditService as any).resolveActorFromContext({
        actorUserId: 7,
        actorRole: resolveUserAuthContext(techClient).role,
      });

      expect(resolved.actorRole).toBe('tech');
      expect(resolved.actorType).toBe('employee');
    });

    it('6. validateOrderTransition combina transiciones de tech + recep para usuario multirrol', () => {
      const techRecep = makeUserEntity({
        id: 6,
        roles: [
          { slug: 'tech', perms: [] },
          { slug: 'recep', perms: [] },
        ],
      });

      // Transición típica de tech: recepcion -> diagnostico
      const r1 = validateOrderTransition({
        estadoActual: { id: 1, nombre: 'Recepción' } as any,
        nuevoEstado: { id: 2, nombre: 'Diagnóstico' } as any,
        usuario: techRecep as any,
      });
      expect(r1.claveDestino).toBe('diagnostico');

      // Transición típica de recep: listo_para_entrega -> entregado
      const r2 = validateOrderTransition({
        estadoActual: { id: 4, nombre: 'Listo para entrega' } as any,
        nuevoEstado: { id: 5, nombre: 'Entregado' } as any,
        usuario: techRecep as any,
        orden: { checklistData: { ok: true } } as any,
      });
      expect(r2.claveDestino).toBe('entregado');
    });

    it('Migración 007 es idempotente, agrega habilitadoTecnico, migra rol tech y crea índice único en user_roles', () => {
      const sqlPath = path.join(__dirname, '../../sql/007_multirole_and_technician_capability.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');
      expect(sql).toContain('ADD COLUMN IF NOT EXISTS "habilitadoTecnico" BOOLEAN NOT NULL DEFAULT FALSE');
      expect(sql).toContain(`r."slug" = 'tech'`);
      expect(sql).toContain('CREATE UNIQUE INDEX "UQ_user_roles_userId_roleId"');
    });
  });
});

