import { PartialType } from '@nestjs/mapped-types';
import { CreateActividadTecnicaDto } from './create-actividad-tecnica.dto';

export class UpdateActividadTecnicaDto extends PartialType(CreateActividadTecnicaDto) {}
