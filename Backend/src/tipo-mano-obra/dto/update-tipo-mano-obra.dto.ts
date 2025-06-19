import { PartialType } from '@nestjs/mapped-types';
import { CreateTipoManoObraDto } from './create-tipo-mano-obra.dto';

export class UpdateTipoManoObraDto extends PartialType(CreateTipoManoObraDto) {}
