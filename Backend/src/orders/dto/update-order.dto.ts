import { IsString, IsArray, IsDateString, IsOptional, IsDate, IsInt, Min, IsEnum } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import { EstadoOrden } from 'src/common/enums/estadoOrden.enum';
import { EstadoFinal } from 'src/common/enums/estadoFinalOrden';
import { TareaRealizar } from 'src/common/enums/tareaRealizar.enum';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {

  @IsOptional()
  @IsString()
  problemaReportado?: string; // Descripción de la falla que presenta el equipo

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  accesorios?: string[]; // Accesorios que dejan (cargadores, mouse, etc.)

  @IsOptional()
  @IsEnum(EstadoOrden)
  estado: EstadoOrden; // Estado que ingresa (Revisión, Reparación, Pendiente, Reparación terminada)

  @IsEnum(EstadoFinal)
  @IsOptional()
  estadoFinal?: EstadoFinal;// Estado final de la orden (Entregado, No Entregado)

  @IsOptional()
  @IsEnum(TareaRealizar)
  tareaRealizar: TareaRealizar; // Reparar, Revisión, Reparación en Garantía COMO INGRESA EL EQUIPO

  
  @IsOptional()
  @IsDateString()
  fechaPrometidaEntrega?: Date; // Fecha y hora prometida de entrega

  @IsOptional()
  @IsDateString()
  fechaActualizacion?: Date; // Fecha de actualización

  @IsOptional()
  @IsInt()
  @Min(1)
  technicianId?: number; // Técnico asignado (opcional en la actualización)
}
