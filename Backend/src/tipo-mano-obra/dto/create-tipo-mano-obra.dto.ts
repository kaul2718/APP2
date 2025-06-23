import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateTipoManoObraDto {
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  codigo: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costo: number;
}