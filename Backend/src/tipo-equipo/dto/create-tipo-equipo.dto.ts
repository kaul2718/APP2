import { IsString } from 'class-validator';
import { IsNotBlank } from 'src/decorators/is-not-blank-decorator';

export class CreateTipoEquipoDto {
  @IsNotBlank({ message: 'El nombre del tipo de equipo no puede estar vacío' })
  @IsString()
  nombre: string;
}
