import { IsInt, IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateNotificacionDto {
  @IsInt()
  usuarioId: number;

  @IsOptional()
  @IsInt()
  ordenServicioId?: number;

  @IsInt()
  tipoId: number;

  @IsString()
  @IsNotEmpty()
  mensaje: string;

  @IsBoolean()
  @IsOptional()
  leido?: boolean;
}
