import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';
import { DataSource } from 'typeorm';
import { HttpException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ClientActivityService } from './client-activity.service';
import { ClientActivityController } from './client-activity.controller';
import { ClientActivityEvent } from './entities/client-activity-event.entity';
import { TrackClientEventDto } from './dto/track-client-events.dto';
import { sanitizeEventMetadata, sanitizePagePath } from './client-activity.catalog';
import { RolesGuard } from '../auth/guard/roles.guard';
import { PermissionsGuard } from '../auth/guard/permissions.guard';
import { jwtConstants } from '../auth/constants/jwt.constant';

const PG_HOST = process.env.TEST_PG_HOST || 'localhost';
const PG_PORT = Number(process.env.TEST_PG_PORT || 5432);
const PG_USER = process.env.TEST_PG_USER || 'postgres';
const PG_PASSWORD = process.env.TEST_PG_PASSWORD || '1234';
const TEST_DB_NAME = `hdc_analytics_test_${Date.now()}`;

describe('Fase 3 — Analítica de Comportamiento de Clientes (PostgreSQL, Seguridad, Rate Limiting y Agregaciones)', () => {
  let adminClient: Client;
  let testDataSource: DataSource;
  let service: ClientActivityService;
  let controller: ClientActivityController;
  let jwtService: JwtService;
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

    // Reejecutar 006 para validar idempotencia
    await dbClient.query(
      fs.readFileSync(path.join(sqlDir, '006_client_activity_events.sql'), 'utf8'),
    );
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

    service = new ClientActivityService(
      testDataSource.getRepository(ClientActivityEvent),
    );
    jwtService = new JwtService({ secret: jwtConstants.secret });
    controller = new ClientActivityController(service, jwtService);
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

  it('1. Valida catálogo cerrado de eventos y rechaza eventos arbitrarios en DTO', async () => {
    const validDto = plainToInstance(TrackClientEventDto, {
      eventName: 'ORDER_LOOKUP_STARTED',
      module: 'portal_publico',
      pagePath: '/consulta',
    });
    expect(await validate(validDto)).toHaveLength(0);

    const invalidDto = plainToInstance(TrackClientEventDto, {
      eventName: 'KEYSTROKE_CAPTURED',
      module: 'portal_publico',
      pagePath: '/consulta',
    });
    const errors = await validate(invalidDto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('2. Sanitiza rutas con tokens/cédulas y excluye PII o claves no permitidas de metadata', () => {
    expect(sanitizePagePath('/consulta?cedula=2300439680&token=secret123')).toBe(
      '/consulta',
    );
    expect(
      sanitizeEventMetadata('CLIENT_FLOW_ERROR', {
        errorCode: 'NOT_FOUND',
        cedula: '2300439680',
        correo: 'cliente@test.com',
        password: '123',
        flow: 'public_consulta',
      }),
    ).toEqual({
      errorCode: 'NOT_FOUND',
      flow: 'public_consulta',
    });
  });

  it('3. Aislamiento de sesiones: anónimos no guardan entityId ni clientUserId; autenticados resuelven userId desde JWT real', async () => {
    const [clientUser] = await testDataSource.query(
      `INSERT INTO "users" ("cedula", "nombre", "apellido", "telefono", "direccion", "ciudad", "estado", "createdAt", "updatedAt")
       VALUES ('0998887771', 'Cliente', 'Portal', '0991112223', 'Centro', 'Quito', true, NOW(), NOW())
       RETURNING id`,
    );

    // Anónimo intentando enviar entityId privado
    await service.recordFrontendBatch(
      [
        {
          eventName: 'ORDER_DETAIL_VIEWED',
          module: 'portal_cliente',
          pagePath: '/ver-orden/999?token=abc',
          sessionId: 'anon-session-123456',
          entityType: 'Order',
          entityId: '999',
        },
      ],
      null,
    );

    // Autenticado con JWT verificado
    const token = await jwtService.signAsync({ sub: clientUser.id });
    await controller.trackEvents(
      {
        events: [
          {
            eventName: 'BUDGET_VIEWED',
            module: 'presupuestos',
            pagePath: `/ver-orden/999`,
            entityType: 'Order',
            entityId: '999',
            metadata: { budgetStatus: 'Pendiente' },
          },
        ],
      },
      {
        headers: { authorization: `Bearer ${token}` },
        socket: { remoteAddress: '127.0.0.1' },
      } as any,
    );

    const rows = await testDataSource.query(
      `SELECT * FROM client_activity_events ORDER BY id ASC`,
    );
    expect(rows).toHaveLength(2);

    // Anónimo: sin client_user_id, sin entity_id, ruta normalizada
    expect(rows[0].actor_mode).toBe('anonymous');
    expect(rows[0].client_user_id).toBeNull();
    expect(rows[0].entity_id).toBeNull();
    expect(rows[0].page_path).toBe('/ver-orden/[id]');

    // Autenticado: client_user_id del JWT, entity_id permitido
    expect(rows[1].actor_mode).toBe('authenticated');
    expect(rows[1].client_user_id).toBe(clientUser.id);
    expect(rows[1].entity_id).toBe('999');
  });

  it('4. Backend registra eventos fiables y getSummary diferencia eventos, consultas, sesiones y clientes únicos', async () => {
    await service.recordBackendEvent({
      eventName: 'ORDER_LOOKUP_SUCCESS',
      module: 'portal_publico',
      pagePath: '/consulta',
      actorMode: 'anonymous',
      metadata: { orderType: 'EXPRESS', step: 2 },
    });
    await service.recordBackendEvent({
      eventName: 'ORDER_LOOKUP_NOT_FOUND',
      module: 'portal_publico',
      pagePath: '/consulta',
      actorMode: 'anonymous',
      metadata: { reason: 'NOT_FOUND' },
    });

    const summary = await service.getSummary({});
    expect(summary.totals.totalEvents).toBeGreaterThanOrEqual(4);
    expect(summary.totals.lookupsSuccess).toBe(1);
    expect(summary.totals.lookupsNotFound).toBe(1);
    expect(summary.totals.distinctSessions).toBe(1);
    expect(summary.totals.distinctAuthenticatedClients).toBe(1);
    expect(summary.technicalUsage.budgetViewed).toBe(1);
    expect(summary.metricsNote).toContain('no deben sumarse');

    await expect(
      service.getSummary({
        from: '2026-01-01T00:00:00.000Z',
        to: '2026-07-01T00:00:00.000Z',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('5. Rate limiting bloquea ráfagas (>30 peticiones/minuto desde misma IP) con 429', async () => {
    const fakeReq: any = {
      headers: {},
      socket: { remoteAddress: '203.0.113.77' },
    };

    for (let i = 0; i < 30; i++) {
      await controller.trackEvents(
        {
          events: [
            {
              eventName: 'PORTAL_PAGE_VIEWED',
              module: 'portal_publico',
              pagePath: '/consulta',
            },
          ],
        },
        fakeReq,
      );
    }

    await expect(
      controller.trackEvents(
        {
          events: [
            {
              eventName: 'PORTAL_PAGE_VIEWED',
              module: 'portal_publico',
              pagePath: '/consulta',
            },
          ],
        },
        fakeReq,
      ),
    ).rejects.toThrow(HttpException);
  });

  it('6. Protección real de GET /client-activity/summary solo para admin con analytics.clients.view', async () => {
    const reflector = new Reflector();
    const rolesGuard = new RolesGuard(reflector);
    const permissionsGuard = new PermissionsGuard(reflector, {} as any);

    const makeCtx = (user: any): any => ({
      getHandler: () => ClientActivityController.prototype.getSummary,
      getClass: () => ClientActivityController,
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    });

    const clientUser = { id: 5, userRoles: [{ rol: { slug: 'client', rolePermissions: [] } }] };
    expect(rolesGuard.canActivate(makeCtx(clientUser))).toBe(false);

    const adminUser = { id: 1, userRoles: [{ rol: { slug: 'admin', rolePermissions: [] } }] };
    expect(rolesGuard.canActivate(makeCtx(adminUser))).toBe(true);
    expect(await permissionsGuard.canActivate(makeCtx(adminUser))).toBe(true);
  });
});

