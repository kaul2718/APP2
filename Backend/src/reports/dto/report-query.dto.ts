import { IsOptional, IsString, IsNumber, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ReportQueryDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @IsString()
  preset?: string; // 'today' | 'yesterday' | 'week' | 'month' | 'last_month' | 'year' | 'all' | 'custom'

  @IsOptional()
  @IsString()
  startDate?: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  endDate?: string; // YYYY-MM-DD

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  estadoId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  tecnicoId?: number;

  @IsOptional()
  @IsString()
  @IsIn(['EXPRESS', 'COMPLETA', 'todos'])
  tipoOrden?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  tipoEquipoId?: number;

  @IsOptional()
  @IsString()
  @IsIn(['todos', 'critico', 'agotado', 'disponible'])
  filtroStock?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 25;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  @IsIn(['productos', 'servicios', 'todos'])
  tipoItem?: string;
}
