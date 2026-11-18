import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AuditLog, AuditActorType, AuditStatus } from './entities/audit-log.entity';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import { getAuditRequestContext } from './audit-context';
import { sanitizeAuditPayload, computeChangedFields } from './audit-sanitizer';
import { resolveUserAuthContext, isOperationalStaff } from '../common/helpers/role.helper';

export interface RecordAuditInput {
  action: string;
  module: string;
  description: string;
  entityType?: string | null;
  entityId?: string | number | null;
  actorUserId?: number | null;
  actorRole?: string | null;
  actorType?: AuditActorType;
  oldValues?: Record<string, any> | null;
  newValues?: Record<string, any> | null;
  allowedFields?: string[];
  changedFields?: string[];
  status?: AuditStatus;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
}

const MAX_RANGE_DAYS = 90;

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  private resolveActorFromContext(input: RecordAuditInput): {
    actorUserId: number | null;
    actorRole: string | null;
    actorType: AuditActorType;
    ipAddress: string | null;
    userAgent: string | null;
    requestId: string | null;
  } {
    const ctx = getAuditRequestContext();
    const ctxUser = ctx?.req?.user;

    const actorUserId =
      input.actorUserId !== undefined
        ? input.actorUserId
        : (ctxUser?.id ?? ctxUser?.sub ?? null);

    const ctxAuth = ctxUser ? resolveUserAuthContext(ctxUser) : null;

    let actorRole: string | null = input.actorRole ?? null;
    if (!actorRole && ctxAuth) {
      actorRole = ctxAuth.roles.length > 0 ? ctxAuth.role : (ctxUser?.role || null);
    }

    let actorType: AuditActorType = input.actorType ?? 'system';
    if (!input.actorType) {
      if (actorUserId) {
        if (ctxUser && isOperationalStaff(ctxUser)) {
          actorType = 'employee';
        } else {
          actorType = actorRole === 'client' ? 'client' : 'employee';
        }
      } else if (ctx?.req) {
        actorType = 'anonymous';
      }
    }

    return {
      actorUserId: actorUserId ? Number(actorUserId) : null,
      actorRole: actorRole ? String(actorRole).slice(0, 30) : null,
      actorType,
      ipAddress: (input.ipAddress ?? ctx?.ipAddress ?? null)?.slice(0, 64) || null,
      userAgent: (input.userAgent ?? ctx?.userAgent ?? null)?.slice(0, 255) || null,
      requestId: (input.requestId ?? ctx?.requestId ?? null)?.slice(0, 64) || null,
    };
  }

  private buildEntity(input: RecordAuditInput): AuditLog {
    const actor = this.resolveActorFromContext(input);
    const sanitizedOld = sanitizeAuditPayload(input.oldValues, input.allowedFields);
    const sanitizedNew = sanitizeAuditPayload(input.newValues, input.allowedFields);
    const changedFields = computeChangedFields(
      sanitizedOld,
      sanitizedNew,
      input.changedFields,
    );

    return this.auditRepository.create({
      actorUserId: actor.actorUserId,
      actorRole: actor.actorRole,
      actorType: actor.actorType,
      action: String(input.action).slice(0, 80),
      module: String(input.module).slice(0, 50),
      entityType: input.entityType ? String(input.entityType).slice(0, 60) : null,
      entityId:
        input.entityId !== undefined && input.entityId !== null
          ? String(input.entityId).slice(0, 64)
          : null,
      description: String(input.description || input.action).slice(0, 500),
      oldValues: sanitizedOld,
      newValues: sanitizedNew,
      changedFields,
      status: input.status ?? 'SUCCESS',
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
      requestId: actor.requestId,
    });
  }

  /**
   * Auditoría CRÍTICA con consistencia transaccional.
   * Si se proporciona un EntityManager de transacción, persiste dentro de esa misma transacción.
   * Nunca silencia errores: si falla la escritura del log, lanza el error para revertir la operación.
   */
  async logCritical(
    input: RecordAuditInput,
    manager?: EntityManager,
  ): Promise<AuditLog> {
    const entity = this.buildEntity(input);
    const repo = manager
      ? manager.getRepository(AuditLog)
      : this.auditRepository;
    return await repo.save(entity);
  }

  /**
   * Auditoría INFORMATIVA o de FALLOS (tolerante a fallos).
   * Pensada para intentos fallidos (ej. login rechazado) o lecturas informativas
   * donde un fallo del log no debe ocultar la respuesta principal.
   */
  async logBestEffort(input: RecordAuditInput): Promise<AuditLog | null> {
    try {
      const entity = this.buildEntity(input);
      return await this.auditRepository.save(entity);
    } catch (error: any) {
      this.logger.warn(
        `No se pudo registrar evento de auditoría [${input.action}]: ${error?.message || error}`,
      );
      return null;
    }
  }

  async findAll(query: QueryAuditLogsDto): Promise<{
    items: AuditLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 25)));

    if (query.from && query.to) {
      const fromDate = new Date(query.from);
      const toDate = new Date(query.to);
      if (toDate < fromDate) {
        throw new BadRequestException('La fecha final no puede ser menor que la fecha inicial.');
      }
      const diffDays = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays > MAX_RANGE_DAYS) {
        throw new BadRequestException(
          `El rango máximo de consulta permitido es de ${MAX_RANGE_DAYS} días.`,
        );
      }
    }

    const qb = this.auditRepository
      .createQueryBuilder('audit')
      .leftJoin('audit.actorUser', 'actorUser')
      .addSelect(['actorUser.id', 'actorUser.nombre', 'actorUser.apellido'])
      .orderBy('audit.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.from) {
      qb.andWhere('audit.createdAt >= :from', { from: new Date(query.from) });
    }
    if (query.to) {
      qb.andWhere('audit.createdAt <= :to', { to: new Date(query.to) });
    }
    if (query.actorUserId) {
      qb.andWhere('audit.actorUserId = :actorUserId', {
        actorUserId: Number(query.actorUserId),
      });
    }
    if (query.module) {
      qb.andWhere('audit.module = :module', { module: query.module.trim() });
    }
    if (query.action) {
      qb.andWhere('audit.action = :action', { action: query.action.trim() });
    }
    if (query.status) {
      qb.andWhere('audit.status = :status', { status: query.status });
    }
    if (query.entityType) {
      qb.andWhere('audit.entityType = :entityType', {
        entityType: query.entityType.trim(),
      });
    }
    if (query.entityId) {
      qb.andWhere('audit.entityId = :entityId', {
        entityId: query.entityId.trim(),
      });
    }
    if (query.search && query.search.trim().length > 0) {
      const q = `%${query.search.trim().slice(0, 80)}%`;
      qb.andWhere(
        '(audit.description ILIKE :q OR audit.action ILIKE :q OR audit.entityId ILIKE :q)',
        { q },
      );
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findOne(id: string): Promise<AuditLog> {
    if (!/^\d+$/.test(String(id))) {
      throw new BadRequestException('Identificador de auditoría inválido.');
    }

    const log = await this.auditRepository
      .createQueryBuilder('audit')
      .leftJoin('audit.actorUser', 'actorUser')
      .addSelect(['actorUser.id', 'actorUser.nombre', 'actorUser.apellido'])
      .where('audit.id = :id', { id: String(id) })
      .getOne();

    if (!log) {
      throw new NotFoundException(`Registro de auditoría #${id} no encontrado.`);
    }

    await this.logBestEffort({
      action: 'AUDIT_DETAIL_VIEWED',
      module: 'audit',
      entityType: 'AuditLog',
      entityId: log.id,
      description: `Consulta administrativa de detalle de auditoría #${log.id}`,
      status: 'SUCCESS',
    });

    return log;
  }
}

