import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateEstadoOrdenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nombre: string;

  @IsString()
  @MaxLength(255)
  descripcion?: string;
}
