import { PartialType } from '@nestjs/mapped-types';
import { CreateEvidenciaTecnicaDto } from './create-evidencia-tecnica.dto';

export class UpdateEvidenciaTecnicaDto extends PartialType(CreateEvidenciaTecnicaDto) {}
