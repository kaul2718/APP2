import { PartialType } from '@nestjs/mapped-types';
import { CreateEstadoOrdenDto } from './create-estado-orden.dto';

export class UpdateEstadoOrdenDto extends PartialType(CreateEstadoOrdenDto) {}
