import { IsString, IsNotEmpty, IsDate, IsDateString, IsOptional } from 'class-validator';

export class CreateActividadTecnicaDto {
    @IsString()
    @IsNotEmpty()
    descripcion: string;

    @IsString()
    @IsNotEmpty()
    diagnostico: string;

    @IsString()
    @IsNotEmpty()
    trabajoRealizado: string;

    @IsDateString()
    @IsOptional() // Esta es opcional ya que se asigna automáticamente en la entidad
    fecha: Date;
}