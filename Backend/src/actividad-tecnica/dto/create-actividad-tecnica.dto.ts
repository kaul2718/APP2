import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min, } from 'class-validator';

export class CreateActividadTecnicaDto {
    @IsInt({ message: 'El ID de la orden debe ser un número entero.' })
    @Min(1, { message: 'El ID de la orden debe ser mayor a 0.' })
    ordenId: number;

    @IsInt({ message: 'El ID del tipo de actividad debe ser un número entero.' })
    @Min(1, { message: 'El ID del tipo de actividad debe ser mayor a 0.' })
    tipoActividadId: number;

    @IsString({ message: 'El diagnóstico debe ser una cadena de texto.' })
    @IsNotEmpty({ message: 'El diagnóstico no debe estar vacío.' })
    diagnostico: string;

    @IsString({ message: 'El trabajo realizado debe ser una cadena de texto.' })
    @IsNotEmpty({ message: 'El trabajo realizado no debe estar vacío.' })
    trabajoRealizado: string;

    @IsOptional()
    @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
    estado?: boolean;
}
