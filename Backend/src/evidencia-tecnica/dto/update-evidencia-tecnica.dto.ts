import { PartialType } from '@nestjs/mapped-types';
import { CreateEvidenciaTecnicaDto } from './create-evidencia-tecnica.dto';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateEvidenciaTecnicaDto extends PartialType(CreateEvidenciaTecnicaDto) {
    @IsNumber()
    @IsNotEmpty()
    ordenId: number;

    @IsNumber()
    @IsNotEmpty()
    subidoPorId: number;

    @IsString()
    @IsUrl()
    @IsNotEmpty()
    archivoUrl: string;

    @IsString()
    @IsOptional()
    descripcion?: string;

    @IsString()
    @IsOptional()
    tipoArchivo?: 'imagen' | 'video';
}
