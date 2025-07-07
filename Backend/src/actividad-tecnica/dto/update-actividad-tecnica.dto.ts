import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateActividadTecnicaDto {
  @IsOptional()
  @IsInt({ message: 'El ID de la orden debe ser un número entero.' })
  @Min(1, { message: 'El ID de la orden debe ser mayor a 0.' })
  ordenId?: number;

  @IsOptional()
  @IsInt({ message: 'El ID del tipo de actividad debe ser un número entero.' })
  @Min(1, { message: 'El ID del tipo de actividad debe ser mayor a 0.' })
  tipoActividadId?: number;

  @IsOptional()
  @IsString({ message: 'El diagnóstico debe ser una cadena de texto.' })
  diagnostico?: string;

  @IsOptional()
  @IsString({ message: 'El trabajo realizado debe ser una cadena de texto.' })
  trabajoRealizado?: string;

  @IsOptional()
  @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
  estado?: boolean;
}
