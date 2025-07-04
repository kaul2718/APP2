import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { IsNotBlank } from 'src/decorators/is-not-blank-decorator';

export class CreateMarcaDto {
  // ✅ Valida que el nombre no sea una cadena vacía o solo con espacios
  @IsNotBlank({ message: 'El nombre no puede estar vacío' })
  @IsString({ message: 'El nombre debe ser un texto válido' })
  nombre: string;

  // ✅ Campo opcional, si se envía debe ser booleano (true o false)
  @IsOptional()
  @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
  estado?: boolean;
}
