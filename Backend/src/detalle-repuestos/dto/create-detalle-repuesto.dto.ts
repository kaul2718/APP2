import { IsNotEmpty, IsNumber, IsPositive, IsOptional, IsString, MaxLength, IsInt } from 'class-validator';

export class CreateDetalleRepuestoDto {
  @IsInt({ message: 'El presupuestoId debe ser un número entero válido.' })
  @IsPositive({ message: 'El presupuestoId debe ser un número positivo.' })
  presupuestoId: number;

  @IsNumber({}, { message: 'La cantidad debe ser un número válido.' })
  @IsPositive({ message: 'La cantidad debe ser un número positivo.' })
  cantidad: number;

  @IsNumber({}, { message: 'El repuestoId debe ser un número válido.' })
  repuestoId: number;

  @IsOptional()
  @IsString({ message: 'El comentario debe ser una cadena de texto.' })
  @MaxLength(500, { message: 'El comentario no puede tener más de 500 caracteres.' })
  comentario?: string;
}
