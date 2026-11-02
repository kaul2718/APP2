import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { TipoActivacion } from '../entities/activacion-cuenta.entity';

export class GenerarActivacionDto {
  @IsNotEmpty({ message: 'El ID de usuario es obligatorio.' })
  @IsInt({ message: 'El ID de usuario debe ser un número entero.' })
  @Min(1, { message: 'El ID de usuario debe ser mayor a 0.' })
  usuarioId: number;

  @IsOptional()
  @IsEnum(TipoActivacion, {
    message: 'El tipo debe ser ACTIVACION o RECUPERACION_PRESENCIAL.',
  })
  tipo?: TipoActivacion;

  @IsOptional()
  @IsString()
  motivo?: string;

  @IsOptional()
  verificacionPresencial?: boolean;
}

