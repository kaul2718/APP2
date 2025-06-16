import { IsNotEmpty, IsNumber, IsPositive, IsDecimal, IsInt, IsOptional } from 'class-validator';

export class CreateDetalleRepuestoDto {
  @IsNotEmpty()
  @IsNumber()
  @IsInt()
  @IsPositive()
  cantidad: number;

  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  precioUnitario?: number;

  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  orderId: number;

  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  repuestoId: number;
}
