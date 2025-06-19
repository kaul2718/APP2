import { IsString,IsNumber } from 'class-validator';
import { IsNotBlank } from 'src/decorators/is-not-blank-decorator';

export class CreateModeloDto {
  @IsNotBlank({ message: 'El nombre del modelo no puede estar vacío' })
  @IsString()
  nombre: string;

  @IsNumber()
  marcaId: number;
}
