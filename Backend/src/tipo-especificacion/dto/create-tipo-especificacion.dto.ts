import { IsString } from 'class-validator';

export class CreateTipoEspecificacionDto {
  @IsString()
  nombre: string;

  @IsString()
  unidad: string;
}
