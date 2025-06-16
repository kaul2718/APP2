import { PartialType } from '@nestjs/mapped-types';
import { CreateActividadTecnicaDto } from './create-actividad-tecnica.dto';
import { IsDate, IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateActividadTecnicaDto extends PartialType(CreateActividadTecnicaDto) {
@IsOptional()  // Esto indica que el campo es opcional
@IsString()
descripcion?: string;

@IsOptional()
@IsDateString()
fecha?: Date;

// Otros campos que desees actualizar
}