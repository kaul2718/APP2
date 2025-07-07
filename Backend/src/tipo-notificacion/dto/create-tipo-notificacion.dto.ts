import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsNotBlank } from 'src/decorators/is-not-blank-decorator';

export class CreateTipoNotificacionDto {

  // ✅ Valida que no sea vacío ni espacios en blanco y que sea una cadena
  @IsNotBlank({ message: 'El nombre del tipo notificación no puede estar vacío' })
  @IsString({ message: 'El nombre del tipo notificación debe ser un texto' })
  nombre: string;

  @IsNotBlank({ message: 'La descripcion del tipo notificación no puede estar vacío' })
  @IsString({ message: 'La descripcion del tipo notificación debe ser un texto' })
  descripcion: string;

  // ✅ Campo opcional que debe ser booleano si se proporciona
  @IsOptional()
  @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
  estado?: boolean;
}
