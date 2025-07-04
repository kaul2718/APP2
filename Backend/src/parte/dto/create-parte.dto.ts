import { IsString, IsInt, Min, IsOptional, IsBoolean } from 'class-validator';

export class CreateParteDto {
  // ✅ Valida que sea un entero y mínimo con valor 1
  @IsInt({ message: 'La categoría debe ser un número entero' })
  @Min(1, { message: 'La categoría debe ser mayor o igual a 1' })
  categoriaId: number;

  // ✅ Valida que sea un entero y mínimo con valor 1
  @IsInt({ message: 'La marca debe ser un número entero' })
  @Min(1, { message: 'La marca debe ser mayor o igual a 1' })
  marcaId: number;

  // ✅ Valida que sea una cadena de texto no vacía
  @IsString({ message: 'El modelo debe ser un texto' })
  modelo: string;

  // ✅ Valida que sea una cadena de texto no vacía
  @IsString({ message: 'El nombre debe ser un texto' })
  nombre: string;

  // ✅ Valida que sea una cadena de texto (puedes usar @IsOptional si no es requerido)
  @IsString({ message: 'La descripción debe ser un texto' })
  descripcion: string;

  // ✅ Campo opcional que debe ser booleano si se envía
  @IsOptional()
  @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
  estado?: boolean;
}
