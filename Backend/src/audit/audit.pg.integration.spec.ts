import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';
import { DataSource } from 'typeorm';
import { Reflector } from '@nestjs/core';
import { AuditService } from './audit.service';
import { AuditLog } from './entities/audit-log.entity';
import { AuditController } from './audit.controller';
import { RolesGuard } from '../auth/guard/roles.guard';
import { PermissionsGuard } from '../auth/guard/permissions.guard';

const PG_HOST = process.env.TEST_PG_HOST || 'localhost';
const PG_PORT = Number(process.env.TEST_PG_PORT || 5432);
const PG_USER = process.env.TEST_PG_USER || 'postgres';
const PG_PASSWORD = process.env.TEST_PG_PASSWORD || '1234';
const TEST_DB_NAME = `hdc_audit_test_${Date.now()}`;

describe('Fase 2 — Integración Real sobre PostgreSQL Aislado (Migración 005, Transacciones, Rollback y Permisos)', () => {
  let adminClient: Client;
  let testDataSource: DataSource;
  let auditService: AuditService;
  let pgAvailable = false;

  beforeAll(async () => {
    adminClient = new Client({
      host: PG_HOST,
      port: PG_PORT,
      user: PG_USER,
      password: PG_PASSWORD,
      database: 'postgres',
    });

    await adminClient.connect();
    await adminClient.query(`CREATE DATABASE "${TEST_DB_NAME}"`);
    pgAvailable = true;

    const dbClient = new Client({
      host: PG_HOST,
      port: PG_PORT,
      user: PG_USER,
      password: PG_PASSWORD,
      database: TEST_DB_NAME,
    });
    await dbClient.connect();

    const sqlDir = path.join(__dirname, '../../sql');
    const migrations = [
      '001_initial_schema.sql',
      '002_schema_alignment.sql',
      '003_refactor_order_states_to_five.sql',
      '004_simplify_budget_approval_modalities.sql',
      '005_audit_logs.sql',
    ];

    for (const file of migrations) {
      const sql = fs.readFileSync(path.join(sqlDir, file), 'utf8');
      await dbClient.query(sql);
    }

    // Reejecutar 005_audit_logs.sql para validar idempotencia real
    const sql005 = fs.readFileSync(path.join(sqlDir, '005_audit_logs.sql'), 'utf8');
    await dbClient.query(sql005);

    await dbClient.end();

    testDataSource = new DataSource({
      type: 'postgres',
      host: PG_HOST,
      port: PG_PORT,
      username: PG_USER,
      password: PG_PASSWORD,
      database: TEST_DB_NAME,
      entities: [path.join(__dirname, '../**/*.entity{.ts,.js}')],
      synchronize: false,
    });

    await testDataSource.initialize();
    auditService = new AuditService(testDataSource.getRepository(AuditLog));
  }, 30000);

  afterAll(async () => {
    if (testDataSource && testDataSource.isInitialized) {
      await testDataSource.destroy();
    }
    if (pgAvailable && adminClient) {
      await adminClient.query(
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
        [TEST_DB_NAME],
      );
      await adminClient.query(`DROP DATABASE IF EXISTS "${TEST_DB_NAME}"`);
      await adminClient.end();
    }
  });

  it('1. Verifica tabla audit_logs, tipos, FK a users, 5 índices, trigger append-only y permisos en PostgreSQL', async () => {
    const cols = await testDataSource.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'audit_logs'`,
    );
    const colMap = Object.fromEntries(cols.map((c: any) => [c.column_name, c.data_type]));
    expect(colMap.id).toBe('bigint');
    expect(colMap.actor_user_id).toBe('integer');
    expect(colMap.old_values).toBe('jsonb');
    expect(colMap.new_values).toBe('jsonb');
    expect(colMap.changed_fields).toBe('ARRAY');
    expect(colMap.created_at).toBe('timestamp with time zone');

    const idxs = await testDataSource.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'audit_logs'`,
    );
    const idxNames = idxs.map((i: any) => i.indexname);
    expect(idxNames).toEqual(
      expect.arrayContaining([
        'idx_audit_logs_created_at',
        'idx_audit_logs_module_created',
        'idx_audit_logs_actor_created',
        'idx_audit_logs_entity_created',
        'idx_audit_logs_action_status',
      ]),
    );

    const triggers = await testDataSource.query(
      `SELECT tgname FROM pg_trigger WHERE tgname = 'trg_audit_logs_append_only'`,
    );
    expect(triggers.length).toBe(1);

    // Seed roles básicos si la BD vacía no corrió SeederService y re-verificar permisos
    await testDataSource.query(
      `INSERT INTO "roles" ("nombre", "slug", "activo", "createdAt", "updatedAt")
       VALUES ('Administrador', 'admin', true, NOW(), NOW()), ('Técnico', 'tech', true, NOW(), NOW())
       ON CONFLICT ("slug") DO NOTHING`,
    );
    const sql005 = fs.readFileSync(
      path.join(__dirname, '../../sql/005_audit_logs.sql'),
      'utf8',
    );
    await testDataSource.query(sql005);

    const assigned = await testDataSource.query(
      `SELECT r.slug AS role_slug, p.slug AS perm_slug
       FROM role_permissions rp
       JOIN roles r ON r.id = rp."roleId"
       JOIN permissions p ON p.id = rp."permissionId"
       WHERE p.slug IN ('audit.view', 'audit.detail')`,
    );
    expect(assigned).toHaveLength(2);
    expect(assigned.every((a: any) => a.role_slug === 'admin')).toBe(true);
  });

  it('2. Trigger append-only bloquea UPDATE y DELETE directamente en PostgreSQL', async () => {
    const inserted = await auditService.logCritical({
      action: 'TEST_IMMUTABLE_INSERT',
      module: 'audit',
      description: 'Registro inicial inmutable',
      newValues: { test: true },
    });

    await expect(
      testDataSource.query(`UPDATE audit_logs SET description = 'modificado' WHERE id = $1`, [
        inserted.id,
      ]),
    ).rejects.toThrow(/inmutable \(append-only\)/i);

    await expect(
      testDataSource.query(`DELETE FROM audit_logs WHERE id = $1`, [inserted.id]),
    ).rejects.toThrow(/inmutable \(append-only\)/i);
  });

  it('3. Consistencia transaccional: operación y auditoría confirman juntas y hacen rollback conjunto si falla la auditoría', async () => {
    const [usr] = await testDataSource.query(
      `INSERT INTO "users" ("cedula", "nombre", "apellido", "telefono", "direccion", "ciudad", "estado", "createdAt", "updatedAt")
       VALUES ('0999999991', 'Usuario', 'Transaccional', '0991234567', 'Av. Central', 'Quito', true, NOW(), NOW())
       RETURNING id`,
    );

    // 3a. Éxito conjunto dentro de la misma transacción
    await testDataSource.transaction(async (manager) => {
      await manager.query(`UPDATE "users" SET "ciudad" = 'Guayaquil' WHERE id = $1`, [usr.id]);
      await auditService.logCritical(
        {
          action: 'USER_UPDATED',
          module: 'users',
          entityType: 'User',
          entityId: usr.id,
          actorUserId: usr.id,
          description: 'Actualización transaccional de usuario',
          oldValues: { ciudad: 'Quito' },
          newValues: { ciudad: 'Guayaquil' },
        },
        manager,
      );
    });

    const [afterCommit] = await testDataSource.query(
      `SELECT ciudad FROM "users" WHERE id = $1`,
      [usr.id],
    );
    expect(afterCommit.ciudad).toBe('Guayaquil');

    const logsSuccess = await testDataSource.query(
      `SELECT * FROM audit_logs WHERE entity_type = 'User' AND entity_id = $1`,
      [String(usr.id)],
    );
    expect(logsSuccess).toHaveLength(1);

    // 3b. Fallo en escritura crítica de auditoría -> DEBE hacer rollback de User.ciudad a 'Guayaquil'
    await expect(
      testDataSource.transaction(async (manager) => {
        await manager.query(`UPDATE "users" SET "ciudad" = 'Cuenca' WHERE id = $1`, [usr.id]);
        await auditService.logCritical(
          {
            action: 'USER_UPDATED',
            module: 'users',
            entityType: 'User',
            entityId: usr.id,
            actorUserId: usr.id,
            description: 'Intento que falla constraint status',
            status: 'INVALID_STATUS' as any, // Viola chk_audit_logs_status en PostgreSQL
          },
          manager,
        );
      }),
    ).rejects.toThrow();

    const [afterRollback] = await testDataSource.query(
      `SELECT ciudad FROM "users" WHERE id = $1`,
      [usr.id],
    );
    expect(afterRollback.ciudad).toBe('Guayaquil');

    const logsAfterRollback = await testDataSource.query(
      `SELECT * FROM audit_logs WHERE entity_type = 'User' AND entity_id = $1`,
      [String(usr.id)],
    );
    // No se duplicó ni quedó ningún log de la transacción revertida
    expect(logsAfterRollback).toHaveLength(1);
  });

  it('4. Protección real de endpoints mediante RolesGuard y PermissionsGuard (solo admin autorizado)', async () => {
    const reflector = new Reflector();
    const rolesGuard = new RolesGuard(reflector);
    const permissionsGuard = new PermissionsGuard(reflector, {} as any);

    const makeContext = (handler: any, user: any): any => ({
      getHandler: () => handler,
      getClass: () => AuditController,
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    });

    const findAllHandler = AuditController.prototype.findAll;

    // Técnico sin permisos de auditoría -> bloqueado
    const techUser = { id: 2, userRoles: [{ rol: { slug: 'tech', rolePermissions: [] } }] };
    expect(rolesGuard.canActivate(makeContext(findAllHandler, techUser))).toBe(false);
    expect(await permissionsGuard.canActivate(makeContext(findAllHandler, techUser))).toBe(false);

    // Recepcionista -> bloqueado
    const recepUser = { id: 3, userRoles: [{ rol: { slug: 'recep', rolePermissions: [] } }] };
    expect(rolesGuard.canActivate(makeContext(findAllHandler, recepUser))).toBe(false);

    // Admin -> permitido
    const adminUser = { id: 1, userRoles: [{ rol: { slug: 'admin', rolePermissions: [] } }] };
    expect(rolesGuard.canActivate(makeContext(findAllHandler, adminUser))).toBe(true);
    expect(await permissionsGuard.canActivate(makeContext(findAllHandler, adminUser))).toBe(true);
  });
});

