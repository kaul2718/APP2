import { IsString, IsNotEmpty, IsNumber, Min, IsInt, IsOptional, IsBoolean } from 'class-validator';
import { IsNotBlank } from 'src/decorators/is-not-blank-decorator';

export class CreateRepuestoDto {
  // ✅ Valida que no sea vacío ni espacios en blanco y que sea una cadena
  @IsNotBlank({ message: 'El código no puede estar vacío' })
  @IsString({ message: 'El código debe ser un texto' })
  codigo: string;

  // ✅ Valida que no sea vacío ni espacios en blanco y que sea una cadena
  @IsNotBlank({ message: 'El nombre no puede estar vacío' })
  @IsString({ message: 'El nombre debe ser un texto' })
  nombre: string;

  // ✅ Valida que no sea vacío ni espacios en blanco y que sea una cadena
  @IsNotBlank({ message: 'La descripción no puede estar vacía' })
  @IsString({ message: 'La descripción debe ser un texto' })
  descripcion: string;

  // ✅ Campo opcional que debe ser booleano si se proporciona
  @IsOptional()
  @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
  estado?: boolean;

  // ✅ Valida que sea un número con hasta 2 decimales y mayor o igual a 0
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El precio de venta debe ser un número válido con hasta 2 decimales' })
  @Min(0, { message: 'El precio de venta no puede ser negativo' })
  precioVenta: number;

  // ✅ Valida que sea un número entero
  @IsInt({ message: 'La parte debe ser un número entero' })
  parteId: number;
}
