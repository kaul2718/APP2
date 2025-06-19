import { PartialType } from '@nestjs/mapped-types';
import { CreateEstadoPresupuestoDto } from './create-estado-presupuesto.dto';

export class UpdateEstadoPresupuestoDto extends PartialType(CreateEstadoPresupuestoDto) {}
