import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { IsNotBlank } from 'src/decorators/is-not-blank-decorator';

export class CreateTipoManoObraDto {
  // ✅ Valida que no sea vacío ni espacios en blanco y que sea un texto
  @IsNotBlank({ message: 'El nombre del tipo de mano de obra no puede estar vacío' })
  @IsString({ message: 'El nombre del tipo de mano de obra debe ser un texto' })
  nombre: string;

  // ✅ Valida que sea un string no vacío
  @IsString({ message: 'El código debe ser un texto' })
  @IsNotEmpty({ message: 'El código no puede estar vacío' })
  codigo: string;

  // ✅ Campo opcional que debe ser texto si se proporciona
  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  descripcion?: string;

  // ✅ Campo opcional que debe ser booleano si se proporciona
  @IsOptional()
  @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
  estado?: boolean;

  // ✅ Valida que sea un número con máximo 2 decimales y que no sea negativo
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El costo debe ser un número válido con hasta 2 decimales' })
  @Min(0, { message: 'El costo no puede ser negativo' })
  costo: number;
}
