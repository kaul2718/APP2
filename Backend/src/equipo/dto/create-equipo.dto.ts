import { IsNumber, IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEquipoDto {
  // ✅ Valida que se proporcione el ID del tipo de equipo y que sea un número
  @IsNotEmpty({ message: 'El tipo de equipo no puede estar vacío' })
  @IsNumber({}, { message: 'El tipo de equipo debe ser un número' })
  @Type(() => Number)
  tipoEquipoId: number;

  // ✅ Valida que se proporcione el ID de la marca y que sea un número
  @IsNotEmpty({ message: 'La marca no puede estar vacía' })
  @IsNumber({}, { message: 'La marca debe ser un número' })
  @Type(() => Number)
  marcaId: number;

  // ✅ El modelo es opcional, pero si se proporciona, debe ser un número
  @IsOptional()
  @IsNumber({}, { message: 'El modelo debe ser un número' })
  @Type(() => Number)
  modeloId?: number;

  // ✅ El número de serie es obligatorio y debe ser texto
  @IsNotEmpty({ message: 'El número de serie no puede estar vacío' })
  @IsString({ message: 'El número de serie debe ser un texto válido' })
  numeroSerie: string;

  // ✅ Campo opcional, si se envía debe ser booleano
  @IsOptional()
  @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
  estado?: boolean;

  // ✅ Campo opcional para asociar a una orden; si se proporciona debe ser numérico
  @IsOptional()
  @IsNumber({}, { message: 'La orden debe ser un número' })
  @Type(() => Number)
  orderId?: number;
}
