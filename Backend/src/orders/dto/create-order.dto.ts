import { IsString, IsArray, IsDateString, IsOptional, IsInt, Min, IsEnum, IsBoolean } from 'class-validator';


export class CreateOrderDto {

  @IsDateString()
  @IsOptional() // Esta es opcional ya que se asigna automáticamente en la entidad
  fechaIngreso: Date; // Fecha que ingresa el equipo al taller

  // ✅ Campo opcional que debe ser booleano si se proporciona
  @IsOptional()
  @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
  estado?: boolean;

  @IsString()
  problemaReportado: string; // Descripción de la falla que presenta el equipo

  @IsArray()
  @IsString({ each: true })
  @IsOptional()

  accesorios?: string[]; // Accesorios que dejan (cargadores, mouse, etc.)

  @IsOptional()
  @IsDateString()
  fechaPrometidaEntrega?: Date; // Fecha y hora prometida de entrega (nuevo campo)

  @IsInt()
  @Min(1)
  @IsOptional() // El técnico es opcional al momento de la creación, se puede asignar más tarde
  technicianId?: number; // ID del técnico asignado

  @IsInt()
  @Min(1)
  @IsOptional()
  clientId?: number; // ID del cliente (usuario)

  @IsOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  recepcionistaId?: number;// ID del recepcionista asignado

  @IsInt()
  @Min(1)
  equipoId?: number; // Asegurar que este campo esté presente

  @IsOptional()
  @IsInt()
  @Min(1)
  estadoOrdenId?: number; // Asegurar que este campo esté presente
}