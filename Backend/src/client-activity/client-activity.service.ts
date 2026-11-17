import {
  Injectable,
  Logger,
  BadRequestException,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ClientActivityEvent,
  ClientActorMode,
  ClientEventSource,
} from './entities/client-activity-event.entity';
import {
  TrackClientEventDto,
  QueryClientActivitySummaryDto,
} from './dto/track-client-events.dto';
import {
  ClientActivityEventName,
  ClientActivityModule as ClientModuleName,
  sanitizeEventMetadata,
  sanitizePagePath,
} from './client-activity.catalog';

export interface RecordBackendClientEventInput {
  eventName: ClientActivityEventName;
  module: ClientModuleName;
  pagePath: string;
  actorMode: ClientActorMode;
  clientUserId?: number | null;
  entityType?: string | null;
  entityId?: string | number | null;
  metadata?: Record<string, unknown> | null;
}

const MAX_SUMMARY_RANGE_DAYS = 90;
const DEFAULT_RETENTION_DAYS = 180;

@Injectable()
export class ClientActivityService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ClientActivityService.name);
  private purgeTimer: NodeJS.Timeout | null = null;
  private isPurging = false;

  constructor(
    @InjectRepository(ClientActivityEvent)
    private readonly eventRepository: Repository<ClientActivityEvent>,
  ) {}

  onModuleInit() {
    if (process.env.CLIENT_ACTIVITY_AUTO_PURGE === 'true') {
      const retentionDays = Number(
        process.env.CLIENT_ACTIVITY_RETENTION_DAYS || DEFAULT_RETENTION_DAYS,
      );
      const oneDayMs = 24 * 60 * 60 * 1000;
      this.purgeTimer = setInterval(() => {
        this.purgeOldEvents(retentionDays)
          .then((res) => {
            if (res.deletedCount > 0) {
              this.logger.log(
                `Retención de analítica: ${res.deletedCount} evento(s) antiguos eliminados (> ${retentionDays} días).`,
              );
            }
          })
          .catch((err) => {
            this.logger.error(
              `Error en tarea programada de retención de analítica: ${err?.message || err}`,
            );
          });
      }, oneDayMs);
      this.purgeTimer.unref?.();
    }
  }

  onModuleDestroy() {
    if (this.purgeTimer) {
      clearInterval(this.purgeTimer);
      this.purgeTimer = null;
    }
  }

  /**
   * Registra eventos enviados desde el frontend (indicadores de interacción).
   * Nunca recibe ni confía en clientUserId enviado por el navegador; lo recibe resuelto desde JWT verificado.
   */
  async recordFrontendBatch(
    events: TrackClientEventDto[],
    verifiedClientUserId: number | null,
  ): Promise<{ accepted: number }> {
    const actorMode: ClientActorMode = verifiedClientUserId
      ? 'authenticated'
      : 'anonymous';

    const entities = events.map((ev) => {
      const sanitizedPath = sanitizePagePath(ev.pagePath).replace(
        /\/ver-orden\/\d+/g,
        '/ver-orden/[id]',
      );

      // Solo asociar entityId cuando el cliente está autenticado; nunca en eventos anónimos del navegador
      const safeEntityId =
        actorMode === 'authenticated' && ev.entityId ? String(ev.entityId) : null;
      const safeEntityType =
        actorMode === 'authenticated' && ev.entityType
          ? String(ev.entityType).slice(0, 50)
          : null;

      return this.eventRepository.create({
        eventName: ev.eventName,
        module: ev.module,
        pagePath: sanitizedPath,
        actorMode,
        source: 'frontend',
        clientUserId: verifiedClientUserId,
        sessionId: ev.sessionId ? String(ev.sessionId).slice(0, 64) : null,
        entityType: safeEntityType,
        entityId: safeEntityId,
        metadata: sanitizeEventMetadata(ev.eventName, ev.metadata),
        frontendVersion: ev.frontendVersion
          ? String(ev.frontendVersion).slice(0, 32)
          : null,
      });
    });

    await this.eventRepository.save(entities);
    return { accepted: entities.length };
  }

  /**
   * Registra un evento fiable directamente desde un servicio del backend (fuente de verdad).
   * Tolerante a fallos: la pérdida de analítica jamás debe bloquear al cliente.
   */
  async recordBackendEvent(
    input: RecordBackendClientEventInput,
  ): Promise<ClientActivityEvent | null> {
    try {
      const entity = this.eventRepository.create({
        eventName: input.eventName,
        module: input.module,
        pagePath: sanitizePagePath(input.pagePath),
        actorMode: input.actorMode,
        source: 'backend' as ClientEventSource,
        clientUserId: input.clientUserId ? Number(input.clientUserId) : null,
        sessionId: null,
        entityType: input.entityType ? String(input.entityType).slice(0, 50) : null,
        entityId:
          input.entityId !== undefined && input.entityId !== null
            ? String(input.entityId).slice(0, 64)
            : null,
        metadata: sanitizeEventMetadata(input.eventName, input.metadata),
        frontendVersion: null,
      });

      return await this.eventRepository.save(entity);
    } catch (error: any) {
      this.logger.warn(
        `No se pudo registrar evento de comportamiento [${input.eventName}]: ${error?.message || error}`,
      );
      return null;
    }
  }

  /**
   * Consultas SQL agregadas para el futuro Dashboard (Fase 4).
   * Distingue explícitamente eventos, consultas, sesiones y clientes autenticados únicos.
   */
  async getSummary(query: QueryClientActivitySummaryDto) {
    const now = new Date();
    const toDate = query.to ? new Date(query.to) : now;
    const fromDate = query.from
      ? new Date(query.from)
      : new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (toDate < fromDate) {
      throw new BadRequestException(
        'La fecha final no puede ser menor que la fecha inicial.',
      );
    }

    const diffDays = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > MAX_SUMMARY_RANGE_DAYS) {
      throw new BadRequestException(
        `El rango máximo permitido para agregaciones es de ${MAX_SUMMARY_RANGE_DAYS} días.`,
      );
    }

    const params: any[] = [fromDate, toDate];
    let moduleClause = '';
    if (query.module) {
      params.push(query.module);
      moduleClause = `AND module = $${params.length}`;
    }

    const [totalsRow] = await this.eventRepository.query(
      `SELECT
        COUNT(*)::int AS "totalEvents",
        COUNT(*) FILTER (WHERE event_name = 'ORDER_LOOKUP_STARTED')::int AS "lookupsStarted",
        COUNT(*) FILTER (WHERE event_name = 'ORDER_LOOKUP_SUCCESS')::int AS "lookupsSuccess",
        COUNT(*) FILTER (WHERE event_name = 'ORDER_LOOKUP_NOT_FOUND')::int AS "lookupsNotFound",
        COUNT(DISTINCT session_id) FILTER (WHERE session_id IS NOT NULL)::int AS "distinctSessions",
        COUNT(DISTINCT client_user_id) FILTER (WHERE actor_mode = 'authenticated' AND client_user_id IS NOT NULL)::int AS "distinctAuthenticatedClients"
      FROM client_activity_events
      WHERE created_at >= $1 AND created_at <= $2 ${moduleClause}`,
      params,
    );

    const lookupsByDay = await this.eventRepository.query(
      `SELECT
        TO_CHAR(DATE_TRUNC('day', created_at AT TIME ZONE 'America/Guayaquil'), 'YYYY-MM-DD') AS "date",
        COUNT(*) FILTER (WHERE event_name = 'ORDER_LOOKUP_STARTED')::int AS "started",
        COUNT(*) FILTER (WHERE event_name = 'ORDER_LOOKUP_SUCCESS')::int AS "success",
        COUNT(*) FILTER (WHERE event_name = 'ORDER_LOOKUP_NOT_FOUND')::int AS "notFound"
      FROM client_activity_events
      WHERE created_at >= $1 AND created_at <= $2 ${moduleClause}
      GROUP BY DATE_TRUNC('day', created_at AT TIME ZONE 'America/Guayaquil')
      ORDER BY DATE_TRUNC('day', created_at AT TIME ZONE 'America/Guayaquil') ASC`,
      params,
    );

    const topPages = await this.eventRepository.query(
      `SELECT
        page_path AS "pagePath",
        COUNT(*)::int AS "views"
      FROM client_activity_events
      WHERE created_at >= $1 AND created_at <= $2 ${moduleClause}
      GROUP BY page_path
      ORDER BY "views" DESC
      LIMIT 10`,
      params,
    );

    const topEvents = await this.eventRepository.query(
      `SELECT
        event_name AS "eventName",
        module,
        source,
        COUNT(*)::int AS "count"
      FROM client_activity_events
      WHERE created_at >= $1 AND created_at <= $2 ${moduleClause}
      GROUP BY event_name, module, source
      ORDER BY "count" DESC
      LIMIT 15`,
      params,
    );

    const [technicalUsage] = await this.eventRepository.query(
      `SELECT
        COUNT(*) FILTER (WHERE event_name = 'DIAGNOSIS_VIEWED')::int AS "diagnosisViewed",
        COUNT(*) FILTER (WHERE event_name = 'BUDGET_VIEWED')::int AS "budgetViewed",
        COUNT(*) FILTER (WHERE event_name = 'BUDGET_APPROVAL_STARTED')::int AS "budgetApprovalStarted",
        COUNT(*) FILTER (WHERE event_name = 'BUDGET_APPROVAL_CANCELLED')::int AS "budgetApprovalCancelled",
        COUNT(*) FILTER (WHERE event_name = 'EVIDENCE_SECTION_VIEWED')::int AS "evidenceSectionViewed",
        COUNT(*) FILTER (WHERE event_name = 'DOCUMENT_DOWNLOAD_STARTED')::int AS "documentDownloadStarted"
      FROM client_activity_events
      WHERE created_at >= $1 AND created_at <= $2 ${moduleClause}`,
      params,
    );

    const errorsByPeriod = await this.eventRepository.query(
      `SELECT
        TO_CHAR(DATE_TRUNC('day', created_at AT TIME ZONE 'America/Guayaquil'), 'YYYY-MM-DD') AS "date",
        COALESCE(metadata->>'errorCode', 'UNKNOWN') AS "errorCode",
        COUNT(*)::int AS "count"
      FROM client_activity_events
      WHERE created_at >= $1 AND created_at <= $2 ${moduleClause}
        AND event_name = 'CLIENT_FLOW_ERROR'
      GROUP BY DATE_TRUNC('day', created_at AT TIME ZONE 'America/Guayaquil'), COALESCE(metadata->>'errorCode', 'UNKNOWN')
      ORDER BY DATE_TRUNC('day', created_at AT TIME ZONE 'America/Guayaquil') DESC, "count" DESC
      LIMIT 30`,
      params,
    );

    return {
      period: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
      metricsNote:
        'Los conteos de eventos, consultas, sesiones temporales y clientes autenticados únicos representan métricas distintas y no deben sumarse entre sí.',
      totals: totalsRow || {
        totalEvents: 0,
        lookupsStarted: 0,
        lookupsSuccess: 0,
        lookupsNotFound: 0,
        distinctSessions: 0,
        distinctAuthenticatedClients: 0,
      },
      lookupsByDay,
      topPages,
      topEvents,
      technicalUsage: technicalUsage || {
        diagnosisViewed: 0,
        budgetViewed: 0,
        budgetApprovalStarted: 0,
        budgetApprovalCancelled: 0,
        evidenceSectionViewed: 0,
        documentDownloadStarted: 0,
      },
      errorsByPeriod,
    };
  }

  /**
   * Política de retención configurable: purga eventos antiguos únicamente de client_activity_events.
   * Previene ejecuciones simultáneas con bloqueo en memoria y nunca toca audit_logs.
   */
  async purgeOldEvents(
    retentionDays: number = DEFAULT_RETENTION_DAYS,
  ): Promise<{ deletedCount: number; skippedConcurrent?: boolean }> {
    if (this.isPurging) {
      return { deletedCount: 0, skippedConcurrent: true };
    }

    this.isPurging = true;
    try {
      const safeDays = Math.max(30, Number(retentionDays || DEFAULT_RETENTION_DAYS));
      const cutoff = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000);
      const result = await this.eventRepository
        .createQueryBuilder()
        .delete()
        .from(ClientActivityEvent)
        .where('created_at < :cutoff', { cutoff })
        .execute();

      return { deletedCount: result.affected || 0 };
    } finally {
      this.isPurging = false;
    }
  }
}

