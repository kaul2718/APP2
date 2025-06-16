import { PartialType } from '@nestjs/mapped-types';
import { CreateServicioDto } from './create-servicio.dto';
import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class UpdateServicioDto extends PartialType(CreateServicioDto) {

    @IsString()
    @IsNotEmpty()
    nombre: string;

    @IsString()
    @IsNotEmpty()
    codigo: string;

    @IsString()
    @IsNotEmpty()
    descripcion: string;

    @IsNumber()
    @Min(0)
    costo: number;
}
