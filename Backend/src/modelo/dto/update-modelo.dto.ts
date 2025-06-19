import { PartialType } from '@nestjs/mapped-types';
import { CreateModeloDto } from './create-modelo.dto';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { IsNotBlank } from 'src/decorators/is-not-blank-decorator';

export class UpdateModeloDto extends PartialType(CreateModeloDto) {
  @IsOptional()
  @IsNotBlank({ message: 'El nombre del modelo no puede estar vacío' })
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsNumber()
  marcaId?: number;
}
