import { PartialType } from '@nestjs/mapped-types';
import { CreateDetalleManoObraDto } from './create-detalle-mano-obra.dto';

export class UpdateDetalleManoObraDto extends PartialType(CreateDetalleManoObraDto) {}
