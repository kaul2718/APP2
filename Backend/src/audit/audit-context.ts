import { AsyncLocalStorage } from 'async_hooks';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';
import { extractClientIp } from '../common/helpers/client-ip.helper';

export interface AuditRequestContext {
  requestId: string;
  ipAddress: string | null;
  userAgent: string | null;
  req?: Request & { user?: any };
}

export const auditContextStorage = new AsyncLocalStorage<AuditRequestContext>();

export function getAuditRequestContext(): AuditRequestContext | undefined {
  return auditContextStorage.getStore();
}

@Injectable()
export class AuditContextMiddleware implements NestMiddleware {
  use(req: Request & { user?: any }, res: Response, next: NextFunction) {
    const incomingReqId = req.headers['x-request-id'];
    const requestId =
      typeof incomingReqId === 'string' && incomingReqId.trim().length > 0
        ? incomingReqId.trim().slice(0, 64)
        : crypto.randomUUID();

    const rawUa = req.headers['user-agent'];
    const userAgent =
      typeof rawUa === 'string' && rawUa.trim().length > 0
        ? rawUa.trim().slice(0, 255)
        : null;

    const ipAddress = extractClientIp(req) || null;

    res.setHeader('X-Request-Id', requestId);

    auditContextStorage.run(
      {
        requestId,
        ipAddress,
        userAgent,
        req,
      },
      () => next(),
    );
  }
}

