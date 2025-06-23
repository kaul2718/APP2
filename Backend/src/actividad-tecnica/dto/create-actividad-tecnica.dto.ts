import { IsNotEmpty, IsInt, IsDateString, IsString } from 'class-validator';

export class CreateActividadTecnicaDto {
    @IsInt()
    ordenId: number;

    @IsInt()
    tipoActividadId: number;

    @IsString()
    @IsNotEmpty()
    diagnostico: string;

    @IsString()
    @IsNotEmpty()
    trabajoRealizado: string;
}
