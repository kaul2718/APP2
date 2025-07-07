import { IsString, IsArray, IsDateString, IsOptional, IsInt, Min, IsBoolean,} from 'class-validator';

export class UpdateOrderDto {

  @IsOptional()
  @IsDateString()
  fechaIngreso?: Date;

  @IsOptional()
  @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
  estado?: boolean;

  @IsOptional()
  @IsString()
  problemaReportado?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  accesorios?: string[];

  @IsOptional()
  @IsDateString()
  fechaPrometidaEntrega?: Date;

  @IsOptional()
  @IsInt()
  @Min(1)
  technicianId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  clientId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  recepcionistaId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  equipoId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  estadoOrdenId?: number;
}
