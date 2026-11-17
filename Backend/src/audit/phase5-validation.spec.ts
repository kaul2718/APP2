import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';
import { DataSource } from 'typeorm';
import { AuditService } from './audit.service';
import { AuditLog } from './entities/audit-log.entity';
import { ClientActivityService } from '../client-activity/client-activity.service';
import { ClientActivityEvent } from '../client-activity/entities/client-activity-event.entity';

const PG_HOST = process.env.TEST_PG_HOST || 'localhost';
const PG_PORT = Number(process.env.TEST_PG_PORT || 5432);
const PG_USER = process.env.TEST_PG_USER || 'postgres';
const PG_PASSWORD = process.env.TEST_PG_PASSWORD || '1234';
const TEST_DB_NAME = `hdc_phase5_test_${Date.now()}`;

describe('Fase 5 — Validación Integral (Retención, Zona Horaria Ecuador, Sanitización API y Migraciones 005+006)', () => {
  let adminClient: Client;
  let testDataSource: DataSource;
  let auditService: AuditService;
  let clientActivityService: ClientActivityService;
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
    for (const file of [
      '001_initial_schema.sql',
      '002_schema_alignment.sql',
      '003_refactor_order_states_to_five.sql',
      '004_simplify_budget_approval_modalities.sql',
      '005_audit_logs.sql',
      '006_client_activity_events.sql',
    ]) {
      await dbClient.query(fs.readFileSync(path.join(sqlDir, file), 'utf8'));
    }

    // Reejecutar 005 y 006 para validar idempotencia completa
    await dbClient.query(fs.readFileSync(path.join(sqlDir, '005_audit_logs.sql'), 'utf8'));
    await dbClient.query(fs.readFileSync(path.join(sqlDir, '006_client_activity_events.sql'), 'utf8'));
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
    clientActivityService = new ClientActivityService(
      testDataSource.getRepository(ClientActivityEvent),
    );
  }, 45000);

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

  it('1. Retención: purgeOldEvents elimina solo eventos expirados, previene ejecución simultánea y protege audit_logs', async () => {
    // Insertar un audit_log de hace 250 días (NO debe ser tocado nunca por purgeOldEvents)
    await testDataSource.query(
      `INSERT INTO audit_logs (action, module, description, status, created_at)
       VALUES ('ORDER_CREATED', 'orders', 'Registro histórico antiguo', 'SUCCESS', NOW() - INTERVAL '250 days')`,
    );

    // Insertar un evento de analítica antiguo (90 días) y uno reciente (2 días)
    await testDataSource.query(
      `INSERT INTO client_activity_events (event_name, module, page_path, actor_mode, source, created_at)
       VALUES
         ('PORTAL_PAGE_VIEWED', 'portal_publico', '/consulta', 'anonymous', 'frontend', NOW() - INTERVAL '90 days'),
         ('ORDER_LOOKUP_SUCCESS', 'portal_publico', '/consulta', 'anonymous', 'backend', NOW() - INTERVAL '2 days')`,
    );

    const [p1, p2] = await Promise.all([
      clientActivityService.purgeOldEvents(30),
      clientActivityService.purgeOldEvents(30),
    ]);

    // Una ejecución purga 1 registro antiguo y la concurrente es omitida con seguridad
    expect(p1.deletedCount + p2.deletedCount).toBe(1);
    expect(p1.skippedConcurrent || p2.skippedConcurrent).toBe(true);

    const remainingAnalytics = await testDataSource.query(
      `SELECT event_name FROM client_activity_events`,
    );
    expect(remainingAnalytics).toHaveLength(1);
    expect(remainingAnalytics[0].event_name).toBe('ORDER_LOOKUP_SUCCESS');

    const remainingAudit = await testDataSource.query(`SELECT action FROM audit_logs`);
    expect(remainingAudit).toHaveLength(1);
    expect(remainingAudit[0].action).toBe('ORDER_CREATED');
  });

  it('2. Zona horaria Ecuador (America/Guayaquil UTC-5): agrupa eventos nocturnos en la fecha local correcta', async () => {
    // 2026-11-10T03:30:00Z == 2026-11-09 22:30:00 en Ecuador (UTC-5)
    await testDataSource.query(
      `INSERT INTO client_activity_events (event_name, module, page_path, actor_mode, source, created_at)
       VALUES ('ORDER_LOOKUP_SUCCESS', 'portal_publico', '/consulta', 'anonymous', 'backend', '2026-11-10T03:30:00.000Z')`,
    );

    const summary = await clientActivityService.getSummary({
      from: '2026-11-09T00:00:00.000Z',
      to: '2026-11-11T00:00:00.000Z',
    });

    const dayRow = summary.lookupsByDay.find((d: any) => d.date === '2026-11-09');
    expect(dayRow).toBeDefined();
    expect(dayRow.success).toBeGreaterThanOrEqual(1);
  });

  it('3. Sanitización en respuestas API: AuditService.findAll y findOne nunca exponen correo, cédula, teléfono ni password del actor', async () => {
    const [usr] = await testDataSource.query(
      `INSERT INTO "users" ("cedula", "nombre", "apellido", "correo", "telefono", "direccion", "ciudad", "password", "estado", "createdAt", "updatedAt")
       VALUES ('2300439680', 'Kevin', 'Urbano', 'kevin@hospital.com', '0991234567', 'Av. Principal', 'Quito', '$2b$10$secrethash', true, NOW(), NOW())
       RETURNING id`,
    );

    const log = await auditService.logCritical({
      action: 'USER_UPDATED',
      module: 'users',
      entityType: 'User',
      entityId: usr.id,
      actorUserId: usr.id,
      actorRole: 'admin',
      description: 'Actualización de prueba',
      newValues: { correo: 'kevin@hospital.com', password: 'SecretPassword' },
    });

    const list = await auditService.findAll({ page: 1, limit: 10 });
    expect(list.items.length).toBeGreaterThanOrEqual(1);
    const listedActor: any = list.items.find((i) => i.id === log.id)?.actorUser;
    expect(listedActor).toBeDefined();
    expect(listedActor.nombre).toBe('Kevin');
    expect(listedActor.correo).toBeUndefined();
    expect(listedActor.cedula).toBeUndefined();
    expect(listedActor.telefono).toBeUndefined();
    expect(listedActor.password).toBeUndefined();

    const detail = await auditService.findOne(log.id);
    const detailActor: any = detail.actorUser;
    expect(detailActor.correo).toBeUndefined();
    expect(detailActor.cedula).toBeUndefined();
    expect(detailActor.password).toBeUndefined();
    expect(detail.newValues?.password).toBeUndefined();
    expect(detail.newValues?.correo).toBe('k***n@hospital.com');
  });
});

