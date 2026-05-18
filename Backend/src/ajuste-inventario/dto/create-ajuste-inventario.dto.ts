import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class DetalleAjusteDto {
  @IsNumber()
  @IsNotEmpty()
  parteId: number;

  @IsNumber()
  @IsNotEmpty()
  stockFisico: number;
}

export class CreateAjusteInventarioDto {
  @IsString()
  @IsNotEmpty()
  motivo: string;

  @IsString()
  @IsOptional()
  comentario?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleAjusteDto)
  @IsNotEmpty()
  detalles: DetalleAjusteDto[];
}
