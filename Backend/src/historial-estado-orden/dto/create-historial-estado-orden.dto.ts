import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateHistorialEstadoOrdenDto {
  @IsInt()
  @IsNotEmpty()
  ordenId: number;

  @IsInt()
  @IsNotEmpty()
  estadoAnteriorId: number;

  @IsInt()
  @IsNotEmpty()
  estadoNuevoId: number;

  @IsInt()
  @IsNotEmpty()
  usuarioEstadoId: number;

  @IsString()
  @IsOptional()
  observaciones?: string;
}
