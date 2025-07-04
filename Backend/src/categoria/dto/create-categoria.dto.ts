import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { IsNotBlank } from 'src/decorators/is-not-blank-decorator';

export class CreateCategoriaDto {
  // ✅ Valida que el nombre no esté vacío ni contenga solo espacios
  @IsNotBlank({ message: 'El nombre de la categoría no puede estar vacío' })
  @IsString({ message: 'El nombre debe ser un texto válido' })
  nombre: string;

  // ✅ Valida que la descripción no esté vacía ni contenga solo espacios
  @IsNotBlank({ message: 'La descripción no puede estar vacía' })
  @IsString({ message: 'La descripción debe ser un texto válido' })
  descripcion: string;

  // ✅ Campo opcional, si se incluye debe ser booleano (true o false)
  @IsOptional()
  @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
  estado?: boolean;
}
