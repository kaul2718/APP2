import { IsNotEmpty, IsNumber, IsPositive, IsOptional, IsInt, IsString, MaxLength } from 'class-validator';

export class CreateDetalleRepuestoDto {
  @IsNumber()
  @IsPositive()
  cantidad: number;

  @IsNumber()
  orderId: number;

  @IsNumber()
  repuestoId: number;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'El comentario no puede tener más de 500 caracteres.' })
  comentario?: string;
}
