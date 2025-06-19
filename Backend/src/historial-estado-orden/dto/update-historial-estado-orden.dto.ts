import { PartialType } from '@nestjs/mapped-types';
import { CreateHistorialEstadoOrdenDto } from './create-historial-estado-orden.dto';

export class UpdateHistorialEstadoOrdenDto extends PartialType(CreateHistorialEstadoOrdenDto) {}
