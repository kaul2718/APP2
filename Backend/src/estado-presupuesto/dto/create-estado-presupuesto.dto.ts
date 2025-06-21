import { IsNotEmpty, IsString } from 'class-validator';

export class CreateEstadoPresupuestoDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  descripcion: string;
}
