import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateEvidenciaTecnicaDto {
  @IsNumber()
  @IsNotEmpty()
  ordenId: number;

  @IsNumber()
  @IsNotEmpty()
  subidoPorId: number;

  @IsString()
  @IsOptional()
  @IsUrl()
  archivoUrl?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  tipoArchivo?: 'imagen' | 'video';
}
