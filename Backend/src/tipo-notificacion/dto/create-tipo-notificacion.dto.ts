import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTipoNotificacionDto {
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
