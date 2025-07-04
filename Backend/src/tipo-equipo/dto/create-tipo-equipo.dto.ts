import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { IsNotBlank } from 'src/decorators/is-not-blank-decorator';

export class CreateTipoEquipoDto {
  // ✅ Valida que el nombre no esté vacío ni solo espacios y sea texto
  @IsNotBlank({ message: 'El nombre del tipo de equipo no puede estar vacío' })
  @IsString({ message: 'El nombre debe ser un texto válido' })
  nombre: string;

  // ✅ Campo opcional. Si se envía, debe ser de tipo booleano (true o false)
  @IsOptional()
  @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
  estado?: boolean;
}
