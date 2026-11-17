import { Controller, Get, Param, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { RequirePermissions } from '../decorators/permissions.decorator';

/**
 * Controlador estrictamente de solo lectura (append-only).
 * No existen endpoints POST, PUT, PATCH ni DELETE para los registros de auditoría.
 */
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Auth('admin')
  @RequirePermissions('audit.view')
  @Get('logs')
  async findAll(@Query() query: QueryAuditLogsDto) {
    const result = await this.auditService.findAll(query);
    return {
      success: true,
      ...result,
    };
  }

  @Auth('admin')
  @RequirePermissions('audit.detail')
  @Get('logs/:id')
  async findOne(@Param('id') id: string) {
    const data = await this.auditService.findOne(id);
    return {
      success: true,
      data,
    };
  }
}

