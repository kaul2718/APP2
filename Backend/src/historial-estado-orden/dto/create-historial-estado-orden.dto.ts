import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateHistorialEstadoOrdenDto {
  @IsInt()
  @IsNotEmpty()
  ordenId: number;

  @IsNumber()
  estadoOrdenId: number;


  @IsNumber()
  usuarioId: number;

  @IsString()
  @IsOptional()
  observaciones?: string;
}
