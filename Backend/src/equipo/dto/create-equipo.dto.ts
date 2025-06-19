import { IsNumber, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEquipoDto {
  @IsNotEmpty({ message: 'El tipo de equipo no puede estar vacío' })
  @IsNumber({}, { message: 'El tipo de equipo debe ser un número' })
  @Type(() => Number)
  tipoEquipoId: number;

  @IsNotEmpty({ message: 'La marca no puede estar vacía' })
  @IsNumber({}, { message: 'La marca debe ser un número' })
  @Type(() => Number)
  marcaId: number;

  @IsNotEmpty({ message: 'El modelo no puede estar vacío' })
  @IsNumber({}, { message: 'El modelo debe ser un número' })
  @Type(() => Number)
  modeloId: number;

  @IsNotEmpty({ message: 'El número de serie no puede estar vacío' })
  @IsString()
  numeroSerie: string;

  @IsOptional()
  @IsNumber({}, { message: 'La orden debe ser un número' })
  @Type(() => Number)
  orderId?: number;
}