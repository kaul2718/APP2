import { IsString, IsArray, IsDateString, IsOptional, IsInt, Min, IsBoolean, ValidateIf, IsEnum, IsObject } from 'class-validator';
import { OrderType } from 'src/common/enums/order-type.enum';

export class UpdateOrderDto {

  @IsOptional()
  @IsDateString()
  fechaIngreso?: Date;

  @IsOptional()
  @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
  estado?: boolean;

  @IsOptional()
  @IsString({ message: 'El problema reportado debe ser una cadena de texto' })
  problemaReportado?: string;

  @IsOptional()
  @IsArray({ message: 'Los accesorios deben ser un arreglo' })
  @IsString({ each: true, message: 'Cada accesorio debe ser una cadena de texto' })
  accesorios?: string[];

  @IsOptional()
  @IsDateString()
  fechaPrometidaEntrega?: Date;

  @IsOptional()
  @ValidateIf(o => o.technicianId !== null && o.technicianId !== undefined)
  @IsInt({ message: 'El ID del técnico debe ser un número entero' })
  @Min(1, { message: 'El ID del técnico debe ser mayor o igual a 1' })
  technicianId?: number | null;

  @IsOptional()
  @ValidateIf(o => o.casilleroId !== null && o.casilleroId !== undefined)
  @IsInt({ message: 'El ID del casillero debe ser un número entero' })
  @Min(1, { message: 'El ID del casillero debe ser mayor o igual a 1' })
  casilleroId?: number | null;

  @IsOptional()
  @IsBoolean({ message: 'esperaRepuesto debe ser un valor booleano' })
  esperaRepuesto?: boolean;

  @IsOptional()
  tiempoEstimadoReparacion?: number;

  @IsOptional()
  @IsInt({ message: 'El ID del cliente debe ser un número entero' })
  @Min(1, { message: 'El ID del cliente debe ser mayor o igual a 1' })
  clientId?: number;

  @IsOptional()
  @IsInt({ message: 'El ID del recepcionista debe ser un número entero' })
  @Min(1, { message: 'El ID del recepcionista debe ser mayor o igual a 1' })
  recepcionistaId?: number;

  @IsOptional()
  @IsInt({ message: 'El ID del equipo debe ser un número entero' })
  @Min(1, { message: 'El ID del equipo debe ser mayor o igual a 1' })
  equipoId?: number;

  @IsOptional()
  @IsInt({ message: 'El ID del estado de orden debe ser un número entero' })
  @Min(1, { message: 'El ID del estado de orden debe ser mayor o igual a 1' })
  estadoOrdenId?: number;

  @IsOptional()
  @IsInt({ message: 'El ID del usuario debe ser un número entero' })
  @Min(1, { message: 'El ID del usuario debe ser mayor o igual a 1' })
  userId?: number; // Nuevo campo para el usuario que realiza la modificación

  @IsOptional()
  @IsEnum(OrderType)
  tipoOrden?: OrderType;

  @IsOptional()
  @IsObject()
  checklistData?: any;
}
