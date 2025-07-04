import { PartialType } from '@nestjs/mapped-types';
import { CreateTipoManoObraDto } from './create-tipo-mano-obra.dto';

export class UpdateTipoManoObraDto extends PartialType(CreateTipoManoObraDto) {
    nombre?: string;
    codigo?: string;
    descripcion?: string;
    estado?: boolean;
    costo?: number;

}
