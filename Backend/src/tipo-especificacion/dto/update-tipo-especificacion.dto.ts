import { PartialType } from '@nestjs/mapped-types';
import { CreateTipoEspecificacionDto } from './create-tipo-especificacion.dto';

export class UpdateTipoEspecificacionDto extends PartialType(CreateTipoEspecificacionDto) {}
