import { PartialType } from '@nestjs/mapped-types';
import { CreateEspecificacionParteDto } from './create-especificacion-parte.dto';

export class UpdateEspecificacionParteDto extends PartialType(CreateEspecificacionParteDto) {}
