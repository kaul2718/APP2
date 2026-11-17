import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ClientActivityService } from './client-activity.service';
import {
  QueryClientActivitySummaryDto,
  TrackClientEventsBatchDto,
} from './dto/track-client-events.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { RequirePermissions } from '../decorators/permissions.decorator';
import { extractClientIp } from '../common/helpers/client-ip.helper';
import { jwtConstants } from '../auth/constants/jwt.constant';

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 30; // Máx. 30 lotes/minuto por IP
const MAX_TRACKED_IPS = 5000;

@Controller('client-activity')
export class ClientActivityController {
  private readonly ipBuckets = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly clientActivityService: ClientActivityService,
    private readonly jwtService: JwtService,
  ) {}

  private enforceRateLimit(ip: string): void {
    const key = ip || 'unknown';
    const now = Date.now();

    // Protección contra crecimiento ilimitado en RAM ante tráfico distribuido
    if (this.ipBuckets.size >= MAX_TRACKED_IPS) {
      for (const [k, entry] of this.ipBuckets.entries()) {
        if (entry.resetAt <= now) {
          this.ipBuckets.delete(k);
        }
      }
      if (this.ipBuckets.size >= MAX_TRACKED_IPS) {
        this.ipBuckets.clear();
      }
    }

    const bucket = this.ipBuckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      this.ipBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      return;
    }

    if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) {
      throw new HttpException(
        'Demasiadas solicitudes de analítica. Intente nuevamente en un minuto.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    bucket.count += 1;
  }

  private async resolveVerifiedUserId(req: Request): Promise<number | null> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.slice(7).trim();
    if (!token) return null;

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });
      return payload?.sub ? Number(payload.sub) : null;
    } catch {
      return null;
    }
  }

  /**
   * Endpoint público / opcionalmente autenticado para registrar eventos de UX del portal.
   * Nunca revela información de órdenes o clientes en su respuesta.
   */
  @Post('events')
  @HttpCode(HttpStatus.ACCEPTED)
  async trackEvents(
    @Body() dto: TrackClientEventsBatchDto,
    @Req() req: Request,
  ) {
    const ip = extractClientIp(req);
    this.enforceRateLimit(ip);

    const verifiedUserId = await this.resolveVerifiedUserId(req);
    const result = await this.clientActivityService.recordFrontendBatch(
      dto.events,
      verifiedUserId,
    );

    return {
      success: true,
      accepted: result.accepted,
    };
  }

  /**
   * Endpoint administrativo de agregaciones para la Fase 4 (Dashboard).
   */
  @Auth('admin')
  @RequirePermissions('analytics.clients.view')
  @Get('summary')
  async getSummary(@Query() query: QueryClientActivitySummaryDto) {
    const data = await this.clientActivityService.getSummary(query);
    return {
      success: true,
      data,
    };
  }
}

