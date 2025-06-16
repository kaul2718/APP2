import { IsString, IsArray, IsDateString, IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { EstadoFinal } from 'src/common/enums/estadoFinalOrden';
import { EstadoOrden } from 'src/common/enums/estadoOrden.enum';
import { TareaRealizar } from 'src/common/enums/tareaRealizar.enum';

export class CreateOrderDto {
  @IsString()
  workOrderNumber: string; // Número de orden de trabajo

  @IsDateString()
  @IsOptional() // Esta es opcional ya que se asigna automáticamente en la entidad
  fechaIngreso: Date; // Fecha que ingresa el equipo al taller

  @IsString()
  problemaReportado: string; // Descripción de la falla que presenta el equipo

  @IsArray()
  @IsString({ each: true })
  accesorios: string[]; // Accesorios que dejan (cargadores, mouse, etc.)

  @IsEnum(EstadoOrden)
  Estado: EstadoOrden; // Estado que ingresa (Revisión, Reparación, Pendiente, Reparación terminada)

  @IsEnum(EstadoFinal)
  @IsOptional()
  EstadoFinal?: EstadoFinal;// Estado final de la orden (Entregado, No Entregado)

  @IsEnum(TareaRealizar)
  tareaRealizar: TareaRealizar; // Reparar, Revisión, Reparación en Garantía COMO INGRESA EL EQUIPO

  @IsOptional()
  @IsDateString()
  fechaPrometidaEntrega: Date; // Fecha y hora prometida de entrega (nuevo campo)

  @IsInt()
  @Min(1)
  @IsOptional() // El técnico es opcional al momento de la creación, se puede asignar más tarde
  technicianId?: number; // ID del técnico asignado

  @IsInt()
  @Min(1)
  clientId: number; // ID del cliente (usuario)

  @IsInt()
  @Min(1)
  equipoId?: number; // Asegurar que este campo esté presente
}