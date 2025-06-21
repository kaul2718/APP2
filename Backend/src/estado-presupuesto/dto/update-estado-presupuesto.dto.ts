import { IsOptional, IsString } from 'class-validator';

export class UpdateEstadoPresupuestoDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
