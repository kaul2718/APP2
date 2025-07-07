import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePresupuestoDto {
  @IsNumber({}, { message: 'El campo "ordenId" debe ser un número' })
  @IsNotEmpty({ message: 'El campo "ordenId" es obligatorio' })
  ordenId: number;

  @IsNumber({}, { message: 'El campo "estadoId" debe ser un número' })
  @IsNotEmpty({ message: 'El campo "estadoId" es obligatorio' })
  estadoId: number;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  descripcion?: string;
}
