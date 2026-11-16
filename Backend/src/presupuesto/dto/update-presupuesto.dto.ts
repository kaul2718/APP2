import { IsNumber, IsOptional, IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ModalidadAutorizacion } from '../entities/autorizacion-presupuesto.entity';

export class UpdatePresupuestoDto {
  @IsOptional()
  @IsNumber({}, { message: 'El campo "ordenId" debe ser un número' })
  @IsNotEmpty({ message: 'El campo "ordenId" no puede estar vacío si se incluye' })
  ordenId?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El campo "estadoId" debe ser un número' })
  @IsNotEmpty({ message: 'El campo "estadoId" no puede estar vacío si se incluye' })
  estadoId?: number;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  descripcion?: string;

  @IsOptional()
  @IsEnum(ModalidadAutorizacion, { message: 'Modalidad de autorización inválida' })
  modalidad?: ModalidadAutorizacion;

  @IsOptional()
  @IsString({ message: 'La observación debe ser una cadena de texto' })
  observaciones?: string;
}
