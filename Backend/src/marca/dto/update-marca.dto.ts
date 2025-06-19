import { PartialType } from '@nestjs/mapped-types';
import { CreateMarcaDto } from './create-marca.dto';
import { IsOptional, IsString } from 'class-validator';
import { IsNotBlank } from 'src/decorators/is-not-blank-decorator';

export class UpdateMarcaDto extends PartialType(CreateMarcaDto) {
  @IsOptional()
  @IsNotBlank({ message: 'El nombre no puede estar vacío' })
  @IsString()
  nombre?: string;
}
