import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateEspecificacionParteDto {
  @IsInt()
  @Min(1)
  parteId: number;

  @IsInt()
  @Min(1)
  tipoEspecificacionId: number;

  @IsString()
  @IsNotEmpty()
  valor: string;
  
  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}
