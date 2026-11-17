import * as fs from 'fs';
import * as path from 'path';
import { BadRequestException, ConflictException, NotFoundException, RequestMethod } from '@nestjs/common';
import { METHOD_METADATA } from '@nestjs/common/constants';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { auditContextStorage } from './audit-context';
import { sanitizeAuditPayload, computeChangedFields } from './audit-sanitizer';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { ParteService } from '../parte/parte.service';
import { EvidenciaTecnicaService } from '../evidencia-tecnica/evidencia-tecnica.service';

describe('Fase 2 — Auditoría Interna Inmutable (AuditService, AuditController, Sanitizador y SQL)', () => {
  let auditService: AuditService;
  let mockRepo: any;
  let savedRecords: any[];

  beforeEach(() => {
    savedRecords = [];
    mockRepo = {
      create: jest.fn((data) => ({ id: String(savedRecords.length + 1), ...data })),
      save: jest.fn(async (entity) => {
        const record = { ...entity, createdAt: new Date() };
        savedRecords.push(record);
        return record;
      }),
      createQueryBuilder: jest.fn(),
    };

    auditService = new AuditService(mockRepo);
  });

  it('1. Registra acciones exitosas tomando actor, rol, IP real, User-Agent y RequestId del contexto HTTP', async () => {
    const fakeReq: any = {
      user: {
        id: 7,
        userRoles: [{ rol: { slug: 'tech' } }],
      },
    };

    await auditContextStorage.run(
      {
        requestId: 'req-uuid-1234',
        ipAddress: '186.42.10.55',
        userAgent: 'Mozilla/5.0 (Mobile)',
        req: fakeReq,
      },
      async () => {
        const log = await auditService.logCritical({
          action: 'ORDER_STATUS_CHANGED',
          module: 'orders',
          entityType: 'Order',
          entityId: '12794',
          description: 'Estado cambiado de Diagnóstico a En Servicio',
          oldValues: { estadoOrden: 'Diagnóstico' },
          newValues: { estadoOrden: 'En Servicio' },
        });

        expect(log.actorUserId).toBe(7);
        expect(log.actorRole).toBe('tech');
        expect(log.actorType).toBe('employee');
        expect(log.ipAddress).toBe('186.42.10.55');
        expect(log.userAgent).toBe('Mozilla/5.0 (Mobile)');
        expect(log.requestId).toBe('req-uuid-1234');
        expect(log.status).toBe('SUCCESS');
        expect(log.changedFields).toEqual(['estadoOrden']);
      },
    );
  });

  it('2. Registra intentos fallidos relevantes (status FAILURE) en modo tolerante a fallos sin guardar contraseñas', async () => {
    const log = await auditService.logBestEffort({
      action: 'AUTH_LOGIN_FAILED',
      module: 'auth',
      entityType: 'User',
      description: 'Intento de inicio de sesión fallido',
      newValues: {
        correo: 'tecnico@hospital.com',
        password: 'SuperSecretPassword123!',
        reason: 'INVALID_PASSWORD',
      },
      status: 'FAILURE',
      actorType: 'anonymous',
    });

    expect(log).not.toBeNull();
    expect(log!.status).toBe('FAILURE');
    expect(log!.newValues?.password).toBeUndefined();
    expect(log!.newValues?.correo).toBe('t***o@hospital.com');
    expect(log!.newValues?.reason).toBe('INVALID_PASSWORD');
  });

  it('3. Excluye recursivamente secretos, tokens, cookies, URLs firmadas, firmas base64 y trunca JSONB gigantes', () => {
    const dirty = {
      nombre: 'Orden 100',
      password: '123',
      resetPasswordToken: 'tok-xyz',
      authorization: 'Bearer abc',
      archivoUrl: 'https://r2.example.com/signed?X-Amz-Signature=secret',
      firmaBase64: 'data:image/png;base64,iVBORw0KGgo...',
      cedula: '2300439680',
      telefono: '0991234567',
      nested: {
        cookie: 'session=abc',
        estado: 'Aprobado',
      },
    };

    const sanitized = sanitizeAuditPayload(dirty);
    expect(sanitized).not.toBeNull();
    expect(sanitized!.password).toBeUndefined();
    expect(sanitized!.resetPasswordToken).toBeUndefined();
    expect(sanitized!.authorization).toBeUndefined();
    expect(sanitized!.archivoUrl).toBeUndefined();
    expect(sanitized!.firmaBase64).toBeUndefined();
    expect(sanitized!.cedula).toBe('230***680');
    expect(sanitized!.telefono).toBe('099***567');
    expect(sanitized!.nested.cookie).toBe('[REDACTED]');
    expect(sanitized!.nested.estado).toBe('Aprobado');

    const hugePayload: Record<string, string> = {};
    for (let i = 0; i < 100; i++) {
      hugePayload[`campo_${i}`] = 'A'.repeat(400);
    }
    const truncated = sanitizeAuditPayload(hugePayload);
    expect(truncated!._truncated).toBe(true);
    expect(truncated!._originalBytes).toBeGreaterThan(16384);
  });

  it('4. Calcula correctamente los campos modificados entre oldValues y newValues', () => {
    const changed = computeChangedFields(
      { estado: 'Pendiente', descripcion: 'Inicial', version: 1 },
      { estado: 'Aprobado', descripcion: 'Inicial', version: 2 },
    );
    expect(changed).toEqual(['estado', 'version']);
  });

  it('5. logCritical usa el EntityManager transaccional y propaga errores (no los silencia) para revertir transacciones', async () => {
    const txRepo = {
      save: jest.fn().mockRejectedValue(new Error('DB constraint failure')),
    };
    const txManager: any = {
      getRepository: jest.fn().mockReturnValue(txRepo),
    };

    await expect(
      auditService.logCritical(
        {
          action: 'BUDGET_APPROVED',
          module: 'presupuestos',
          entityType: 'Presupuesto',
          entityId: 44,
          description: 'Aprobación de presupuesto',
        },
        txManager,
      ),
    ).rejects.toThrow('DB constraint failure');

    expect(txManager.getRepository).toHaveBeenCalled();
  });

  it('6. logBestEffort no interrumpe la operación principal si falla la escritura en BD', async () => {
    mockRepo.save.mockRejectedValueOnce(new Error('Connection timeout'));

    const res = await auditService.logBestEffort({
      action: 'AUTH_LOGIN_FAILED',
      module: 'auth',
      description: 'Login fallido',
      status: 'FAILURE',
    });

    expect(res).toBeNull();
  });

  it('7. Rechaza rangos mayores a 90 días y valida formato numérico en findOne', async () => {
    await expect(
      auditService.findAll({
        from: '2026-01-01T00:00:00.000Z',
        to: '2026-06-01T00:00:00.000Z',
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(auditService.findOne('abc-not-id')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('8. Control de acceso e inmutabilidad en AuditController: solo GET con rol admin y permisos audit.view / audit.detail', () => {
    const proto = AuditController.prototype;
    const methodNames = Object.getOwnPropertyNames(proto).filter(
      (m) => m !== 'constructor',
    );

    expect(methodNames.sort()).toEqual(['findAll', 'findOne']);

    for (const methodName of methodNames) {
      const handler = (proto as any)[methodName];
      const httpMethod = Reflect.getMetadata(METHOD_METADATA, handler);
      expect(httpMethod).toBe(RequestMethod.GET);

      const roles = Reflect.getMetadata(ROLES_KEY, handler);
      expect(roles).toEqual(['admin']);
    }

    expect(Reflect.getMetadata(PERMISSIONS_KEY, proto.findAll)).toEqual(['audit.view']);
    expect(Reflect.getMetadata(PERMISSIONS_KEY, proto.findOne)).toEqual(['audit.detail']);
  });

  it('9. Migración SQL 005_audit_logs.sql garantiza trigger append-only y asigna permisos solo a admin', () => {
    const sqlPath = path.join(__dirname, '../../sql/005_audit_logs.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS "audit_logs"');
    expect(sql).toContain('prevent_audit_logs_mutation()');
    expect(sql).toContain('BEFORE UPDATE OR DELETE ON "audit_logs"');
    expect(sql).toContain("'audit.view'");
    expect(sql).toContain("'audit.detail'");
    expect(sql).toContain("WHERE r.\"slug\" = 'admin'");
  });

  it('10. ParteService audita cambios directos de precio/costo en transacción compartida', async () => {
    const existingParte: any = {
      id: 12,
      nombre: 'Pantalla IPS 15.6',
      codigoInterno: 'PANT-12',
      costo: 45,
      precio1: 80,
      precio2: 75,
      precio3: 70,
      stock: 5,
      estado: true,
    };

    const txParteRepo = {
      save: jest.fn(async (p) => p),
    };
    const mockParteRepo: any = {
      findOne: jest.fn().mockResolvedValue(existingParte),
      manager: {
        transaction: jest.fn(async (cb: any) =>
          cb({
            getRepository: jest.fn((ent: any) =>
              ent?.name === 'AuditLog' ? mockRepo : txParteRepo,
            ),
          }),
        ),
      },
    };

    const parteService = new ParteService(
      mockParteRepo,
      {} as any,
      {} as any,
      { checkAndNotificarStockBajo: jest.fn().mockResolvedValue(undefined) } as any,
      auditService,
    );

    await parteService.update(12, { costo: 50, precio1: 95 });

    expect(savedRecords).toHaveLength(1);
    expect(savedRecords[0].action).toBe('CATALOG_ITEM_PRICE_UPDATED');
    expect(savedRecords[0].module).toBe('inventario');
    expect(savedRecords[0].oldValues).toMatchObject({ costo: 45, precio1: 80 });
    expect(savedRecords[0].newValues).toMatchObject({ costo: 50, precio1: 95 });
    expect(savedRecords[0].changedFields).toEqual(expect.arrayContaining(['costo', 'precio1']));
  });

  it('11. EvidenciaTecnicaService no borra R2 si otro registro lo referencia y registra R2_CLEANUP_PENDING si falla limpieza', async () => {
    const mockStorage: any = {
      deleteFile: jest.fn(),
    };
    const mockEvRepo: any = {
      find: jest.fn().mockResolvedValue([{ id: 10 }, { id: 11 }]),
    };

    const evService = new EvidenciaTecnicaService(
      mockEvRepo,
      {} as any,
      {} as any,
      mockStorage,
      {} as any,
      auditService,
    );

    // 11a. Otro registro activo (id 11) referencia la clave -> NO debe borrar de R2
    const deletedWhenShared = await evService.safeDeleteR2IfUnreferenced(
      'ordenes/ODS-1/evidencias/videos/shared.mp4',
      10,
      'post_commit',
    );
    expect(deletedWhenShared).toBe(false);
    expect(mockStorage.deleteFile).not.toHaveBeenCalled();

    // 11b. Ningún otro registro la referencia, pero R2 falla -> registra R2_CLEANUP_PENDING
    mockEvRepo.find.mockResolvedValueOnce([{ id: 10 }]);
    mockStorage.deleteFile.mockRejectedValueOnce(new Error('R2 timeout'));

    const deletedOnFailure = await evService.safeDeleteR2IfUnreferenced(
      'ordenes/ODS-1/evidencias/videos/orphan.mp4',
      10,
      'post_commit',
    );
    expect(deletedOnFailure).toBe(false);
    expect(savedRecords).toHaveLength(1);
    expect(savedRecords[0].action).toBe('R2_CLEANUP_PENDING');
    expect(savedRecords[0].status).toBe('FAILURE');
    expect(savedRecords[0].newValues.storageKey).toBe(
      'ordenes/ODS-1/evidencias/videos/orphan.mp4',
    );
  });
});

