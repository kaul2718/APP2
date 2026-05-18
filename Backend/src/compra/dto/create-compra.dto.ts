import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCompraDetalleDto {
  @IsNumber()
  @IsNotEmpty()
  parteId: number;

  @IsNumber()
  @IsNotEmpty()
  cantidad: number;

  @IsNumber()
  @IsNotEmpty()
  precioUnitario: number;

  @IsBoolean()
  @IsOptional()
  actualizarCosto?: boolean;
}

export class CreateCompraDto {
  @IsString()
  @IsNotEmpty()
  numeroFactura: string;

  @IsNumber()
  @IsNotEmpty()
  proveedorId: number;

  @IsString()
  @IsNotEmpty()
  fecha: string;

  @IsNumber()
  @IsNotEmpty()
  ivaPorcentaje: number; // Selected rate (0, 5, 8, 15)

  @IsString()
  @IsOptional()
  comentario?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCompraDetalleDto)
  detalles: CreateCompraDetalleDto[];
}
