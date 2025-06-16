import { EstadoCasillero } from "src/common/enums/estadoCasillero.enum";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateCasilleroDto {

    @IsString()
    numero: string;

    @IsEnum(EstadoCasillero)
    estado: EstadoCasillero;

    @IsString()
    descripcion: string;

    @IsNumber()
    @IsOptional()
    orderId?: number; // Opcional porque la orden podría asignarse después
}