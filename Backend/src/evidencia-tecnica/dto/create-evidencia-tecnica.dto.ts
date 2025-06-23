import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateEvidenciaTecnicaDto {
  @IsNumber()
  @IsNotEmpty()
  ordenId: number;

  @IsNumber()
  @IsNotEmpty()
  subidoPorId: number;

  @IsString()
  @IsUrl()
  @IsNotEmpty()
  urlImagen: string;

  @IsString()
  @IsOptional()
  descripcion?: string;
}
