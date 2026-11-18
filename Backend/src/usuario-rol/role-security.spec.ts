import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../auth/guard/roles.guard';
import { PermissionsGuard } from '../auth/guard/permissions.guard';
import { UsuarioRolController } from './usuario-rol.controller';
import { UsuarioRolService } from './usuario-rol.service';
import { RolController } from '../rol/rol.controller';
import { PermissionsController } from '../permissions/permissions.controller';
import { UsersController } from '../users/users.controller';
import { AuthService } from '../auth/auth.service';

function makeExecutionContext(
  handler: Function,
  controllerClass: Function,
  user?: any,
) {
  return {
    getHandler: () => handler,
    getClass: () => controllerClass,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as any;
}

function makeUser(slug: string, permissions: string[] = [], id = 10) {
  return {
    id,
    sub: id,
    role: slug,
    userRoles: [
      {
        rol: {
          slug,
          rolePermissions: permissions.map((p) => ({
            permission: { slug: p },
          })),
        },
      },
    ],
  };
}

describe('Seguridad de asignación y gestión de roles y permisos (Prioridad 1)', () => {
  let reflector: Reflector;
  let rolesGuard: RolesGuard;
  let permissionsGuard: PermissionsGuard;

  beforeEach(() => {
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);
    permissionsGuard = new PermissionsGuard(reflector, {} as any);
  });

  describe('1. UsuarioRolController — bloqueo estricto para no-administradores', () => {
    const protectedMethods: Array<keyof UsuarioRolController> = [
      'create',
      'findAll',
      'findOne',
      'findByUserId',
      'update',
      'remove',
      'assignRole',
      'removeRole',
    ];

    it.each(protectedMethods)(
      'rechaza a client, tech y recep en UsuarioRolController.%s',
      async (methodName) => {
        const handler = UsuarioRolController.prototype[methodName] as Function;
        const unauthorizedUsers = [
          undefined,
          makeUser('client', [], 2),
          makeUser('tech', ['orders.view', 'orders.edit'], 3),
          makeUser('recep', ['orders.create', 'users.create'], 4),
        ];

        for (const actor of unauthorizedUsers) {
          const ctx = makeExecutionContext(handler, UsuarioRolController, actor);
          const roleAllowed = rolesGuard.canActivate(ctx);
          const permAllowed = await permissionsGuard.canActivate(ctx);
          expect(roleAllowed && permAllowed).toBe(false);
        }
      },
    );

    it.each(protectedMethods)(
      'permite a un administrador legítimo operar en UsuarioRolController.%s',
      async (methodName) => {
        const handler = UsuarioRolController.prototype[methodName] as Function;
        const adminUser = makeUser('admin', ['roles.manage'], 1);
        const ctx = makeExecutionContext(handler, UsuarioRolController, adminUser);

        expect(rolesGuard.canActivate(ctx)).toBe(true);
        expect(await permissionsGuard.canActivate(ctx)).toBe(true);
      },
    );
  });

  describe('2. RolController y PermissionsController — protección administrativa', () => {
    const rolMutatingMethods: Array<keyof RolController> = [
      'create',
      'findOne',
      'update',
      'remove',
      'assignPermission',
      'getPermissions',
      'setPermissions',
      'removePermission',
    ];

    it.each(rolMutatingMethods)(
      'bloquea a client, tech y recep en RolController.%s',
      async (methodName) => {
        const handler = RolController.prototype[methodName] as Function;
        for (const slug of ['client', 'tech', 'recep']) {
          const ctx = makeExecutionContext(handler, RolController, makeUser(slug));
          expect(rolesGuard.canActivate(ctx) && (await permissionsGuard.canActivate(ctx))).toBe(false);
        }
      },
    );

    it('bloquea a client, tech y recep en PermissionsController', async () => {
      const methods: Array<keyof PermissionsController> = [
        'create',
        'findAll',
        'findOne',
        'update',
        'remove',
      ];
      for (const methodName of methods) {
        const handler = PermissionsController.prototype[methodName] as Function;
        for (const slug of ['client', 'tech', 'recep']) {
          const ctx = makeExecutionContext(handler, PermissionsController, makeUser(slug));
          expect(rolesGuard.canActivate(ctx) && (await permissionsGuard.canActivate(ctx))).toBe(false);
        }
      }
    });
  });

  describe('3. Endpoints alternativos (AuthService.register, UsersController.create/update)', () => {
    it('AuthService.register ignora roleIds=["admin"] y fuerza rol client', async () => {
      const mockUsersService = {
        findByEmail: jest.fn().mockResolvedValue(null),
        findAll: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({
          id: 99,
          nombre: 'Test',
          apellido: 'User',
          correo: 'test@example.com',
        }),
      } as any;

      const authService = new AuthService(
        mockUsersService,
        {} as any,
        {} as any,
      );

      await authService.register({
        cedula: '0503646812',
        nombre: 'Test',
        apellido: 'User',
        correo: 'test@example.com',
        telefono: '0999999999',
        direccion: 'Dir',
        ciudad: 'Quito',
        password: 'Password123',
        roleIds: ['admin'],
      });

      expect(mockUsersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'client' }),
      );
    });

    it('UsersController.create no permite que un técnico pase RolesGuard y fuerza client si no es admin', async () => {
      const techCtx = makeExecutionContext(
        UsersController.prototype.create,
        UsersController,
        makeUser('tech', ['orders.view'], 3),
      );
      expect(rolesGuard.canActivate(techCtx)).toBe(false);

      const mockUsersService = { create: jest.fn().mockResolvedValue({ id: 50 }) } as any;
      const controller = new UsersController(mockUsersService);
      const recepUser = makeUser('recep', ['users.create'], 4);
      const dto: any = { nombre: 'X', role: 'admin', roleIds: [1] };

      await controller.create(recepUser, dto);
      expect(mockUsersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'client', roleIds: undefined }),
      );
    });

    it('UsersController.update impide que client, tech o recep modifiquen roleIds o editen otros perfiles sin permiso', async () => {
      const mockUsersService = { update: jest.fn().mockResolvedValue({ id: 10 }) } as any;
      const controller = new UsersController(mockUsersService);

      // Client intentando asignarse admin en su propio perfil
      await expect(
        controller.update(makeUser('client', [], 10), 10, { roleIds: [1] } as any),
      ).rejects.toThrow(ForbiddenException);

      // Tech intentando editar el perfil de otro usuario
      await expect(
        controller.update(makeUser('tech', [], 3), 10, { nombre: 'Hack' } as any),
      ).rejects.toThrow(ForbiddenException);

      // Recep intentando escalar privilegios vía roleIds
      await expect(
        controller.update(makeUser('recep', [], 4), 10, { roleIds: [1] } as any),
      ).rejects.toThrow(ForbiddenException);

      // Admin legítimo sí puede actualizar roles
      await controller.update(makeUser('admin', ['roles.manage'], 1), 10, { roleIds: [2] } as any);
      expect(mockUsersService.update).toHaveBeenCalledWith(10, { roleIds: [2] }, 'admin');
    });
  });

  describe('4. Auditoría obligatoria en cambios de roles (UsuarioRolService)', () => {
    it('registra USER_ROLE_ASSIGNED y USER_ROLE_REMOVED en AuditService con roles anteriores y nuevos', async () => {
      const logCritical = jest.fn().mockResolvedValue(undefined);
      const auditService = { logCritical } as any;

      const userRoleRepo = {
        findOne: jest.fn(),
        find: jest.fn(),
        create: jest.fn((v) => ({ id: 77, ...v })),
        save: jest.fn(async (v) => v),
        remove: jest.fn(async () => undefined),
      };
      const userRepo = {
        findOne: jest.fn().mockResolvedValue({ id: 5, nombre: 'Ana', apellido: 'Pérez' }),
      };
      const rolRepo = {
        findOne: jest.fn().mockResolvedValue({ id: 1, slug: 'admin' }),
      };

      const fakeManager = {
        getRepository: jest.fn((entity: any) => {
          if (entity.name === 'User') return userRepo;
          if (entity.name === 'Rol') return rolRepo;
          return userRoleRepo;
        }),
      };

      const rootUserRoleRepo = {
        manager: {
          transaction: jest.fn(async (cb: any) => cb(fakeManager)),
        },
      } as any;

      const service = new UsuarioRolService(
        rootUserRoleRepo,
        userRepo as any,
        rolRepo as any,
        auditService,
      );

      // Asignación: usuario tenía ['tech'] y recibe 'admin'
      userRoleRepo.findOne.mockResolvedValueOnce(null);
      userRoleRepo.find.mockResolvedValueOnce([{ rol: { slug: 'tech' } }]);

      await service.assignRoleToUser(5, 1);

      expect(logCritical).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_ROLE_ASSIGNED',
          module: 'roles',
          entityType: 'User',
          entityId: 5,
          oldValues: { roles: ['tech'] },
          newValues: expect.objectContaining({
            roles: ['tech', 'admin'],
            assignedRoleId: 1,
            assignedRoleSlug: 'admin',
          }),
          status: 'SUCCESS',
        }),
        fakeManager,
      );

      // Eliminación: usuario tenía ['tech', 'admin'] y se le quita 'admin'
      userRoleRepo.findOne.mockResolvedValueOnce({
        id: 77,
        userId: 5,
        roleId: 1,
        rol: { slug: 'admin' },
      });
      userRoleRepo.find
        .mockResolvedValueOnce([{ rol: { slug: 'tech' } }, { rol: { slug: 'admin' } }])
        .mockResolvedValueOnce([{ rol: { slug: 'tech' } }]);

      await service.removeRoleFromUser(5, 1);

      expect(logCritical).toHaveBeenLastCalledWith(
        expect.objectContaining({
          action: 'USER_ROLE_REMOVED',
          module: 'roles',
          entityType: 'User',
          entityId: 5,
          oldValues: { roles: ['tech', 'admin'] },
          newValues: expect.objectContaining({
            roles: ['tech'],
            removedRoleId: 1,
            removedRoleSlug: 'admin',
          }),
          status: 'SUCCESS',
        }),
        fakeManager,
      );
    });

    it('propaga fallo si AuditService.logCritical falla para revertir la transacción en PostgreSQL', async () => {
      const logCritical = jest
        .fn()
        .mockRejectedValue(new Error('audit_logs append-only failure'));

      const userRoleRepo = {
        findOne: jest.fn().mockResolvedValue(null),
        find: jest.fn().mockResolvedValue([]),
        create: jest.fn((v) => ({ id: 88, ...v })),
        save: jest.fn(async (v) => v),
      };
      const fakeManager = {
        getRepository: jest.fn((entity: any) => {
          if (entity.name === 'User') {
            return { findOne: jest.fn().mockResolvedValue({ id: 5, nombre: 'Ana' }) };
          }
          if (entity.name === 'Rol') {
            return { findOne: jest.fn().mockResolvedValue({ id: 1, slug: 'admin' }) };
          }
          return userRoleRepo;
        }),
      };
      const rootUserRoleRepo = {
        manager: {
          transaction: jest.fn(async (cb: any) => cb(fakeManager)),
        },
      } as any;

      const service = new UsuarioRolService(
        rootUserRoleRepo,
        {} as any,
        {} as any,
        { logCritical } as any,
      );

      await expect(service.assignRoleToUser(5, 1)).rejects.toThrow(
        'audit_logs append-only failure',
      );
    });
  });
});

