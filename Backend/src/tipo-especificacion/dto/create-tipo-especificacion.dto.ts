import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { IsNotBlank } from 'src/decorators/is-not-blank-decorator';

export class CreateTipoEspecificacionDto {
  // ✅ Valida que el nombre no esté vacío ni tenga solo espacios
  @IsNotBlank({ message: 'El nombre de la especificación no puede estar vacío' })
  @IsString({ message: 'El nombre debe ser un texto válido' })
  nombre: string;

  // ✅ Valida que la unidad no esté vacía ni tenga solo espacios
  @IsNotBlank({ message: 'La unidad de la especificación no puede estar vacía' })
  @IsString({ message: 'La unidad debe ser un texto válido' })
  unidad: string;

  // ✅ Campo opcional. Si se incluye, debe ser un booleano (true o false)
  @IsOptional()
  @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
  estado?: boolean;
}
