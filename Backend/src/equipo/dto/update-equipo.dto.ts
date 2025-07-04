import { PartialType } from '@nestjs/mapped-types';
import { CreateEquipoDto } from './create-equipo.dto';

export class UpdateEquipoDto extends PartialType(CreateEquipoDto) {

    numeroSerie?: string;
    estado?: boolean;
    tipoEquipoId?: number;
    marcaId?: number;
    modeloId?: number;
}
