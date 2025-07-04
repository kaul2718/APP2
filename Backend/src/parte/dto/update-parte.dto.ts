import { PartialType } from '@nestjs/mapped-types';
import { CreateParteDto } from './create-parte.dto';

export class UpdateParteDto extends PartialType(CreateParteDto) {
    modelo?: string;
    nombre?: string;
    descripcion?: string;
    categoriaId?: number;
    marcaId?: number;
    estado?: boolean;
}
