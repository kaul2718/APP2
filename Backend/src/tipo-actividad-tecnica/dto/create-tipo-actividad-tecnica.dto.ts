import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsNotBlank } from 'src/decorators/is-not-blank-decorator';

export class CreateTipoActividadTecnicaDto {

  // ✅ Valida que no sea vacío ni espacios en blanco y que sea una cadena
  @IsNotBlank({ message: 'El nombre del modelo no puede estar vacío' })
  nombre: string;

  @IsOptional()
  @IsString({ message: 'El nombre del modelo debe ser un texto' })
  descripcion?: string;

  // ✅ Campo opcional que debe ser booleano si se proporciona
  @IsOptional()
  @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
  estado?: boolean;

}
