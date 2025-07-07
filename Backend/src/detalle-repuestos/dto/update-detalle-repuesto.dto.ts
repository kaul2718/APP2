import { PartialType } from '@nestjs/mapped-types';
import { IsNumber, IsPositive, IsOptional, IsString, MaxLength, IsBoolean } from 'class-validator';
import { CreateDetalleRepuestoDto } from './create-detalle-repuesto.dto';

export class UpdateDetalleRepuestoDto extends PartialType(CreateDetalleRepuestoDto) {

  @IsOptional()
  @IsNumber({}, { message: 'La cantidad debe ser un número válido.' })
  @IsPositive({ message: 'La cantidad debe ser un número positivo.' })
  cantidad?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El repuestoId debe ser un número válido.' })
  repuestoId?: number;

  @IsOptional()
  @IsString({ message: 'El comentario debe ser una cadena de texto.' })
  @MaxLength(500, { message: 'El comentario no puede tener más de 500 caracteres.' })
  comentario?: string;
  
  @IsOptional()
  @IsBoolean({ message: 'El estado debe ser un valor booleano (verdadero/falso)' })
  estado?: boolean;
}
