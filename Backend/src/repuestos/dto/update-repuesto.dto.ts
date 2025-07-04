import { PartialType } from '@nestjs/mapped-types';
import { CreateRepuestoDto } from './create-repuesto.dto';

export class UpdateRepuestoDto extends PartialType(CreateRepuestoDto) {
    codigo?: string;
    nombre?: string;
    descripcion?: string;
    estado?: boolean;
    precioVenta?: number;
    parteId?: number;

}
