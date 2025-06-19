import { IsString } from 'class-validator';
import { IsNotBlank } from 'src/decorators/is-not-blank-decorator';

export class CreateMarcaDto {
  @IsNotBlank({ message: 'El nombre no puede estar vacío' })
  @IsString()
  nombre: string;
}
