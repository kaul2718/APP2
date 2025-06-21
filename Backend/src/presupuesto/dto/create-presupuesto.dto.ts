import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePresupuestoDto {
  @IsNumber()
  ordenId: number;

  @IsNumber()
  estadoId: number;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
