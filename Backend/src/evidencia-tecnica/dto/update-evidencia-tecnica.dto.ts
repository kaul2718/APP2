import { PartialType } from '@nestjs/mapped-types';
import { CreateEvidenciaTecnicaDto } from './create-evidencia-tecnica.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateEvidenciaTecnicaDto extends PartialType(CreateEvidenciaTecnicaDto) {
  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  tipoArchivo?: 'imagen' | 'video';
}
