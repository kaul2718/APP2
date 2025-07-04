import { PartialType } from '@nestjs/mapped-types';
import { CreateTipoActividadTecnicaDto } from './create-tipo-actividad-tecnica.dto';

export class UpdateTipoActividadTecnicaDto extends PartialType(CreateTipoActividadTecnicaDto) {
    nombre?: string;
    descripcion?: string;
    estado?: boolean;
}
