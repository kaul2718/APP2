import { PartialType } from '@nestjs/mapped-types';
import { CreateDetalleServicioDto } from './create-detalle-servicio.dto';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive } from "class-validator";

export class UpdateDetalleServicioDto extends PartialType(CreateDetalleServicioDto) {

    @IsInt()
    @IsPositive()
    @IsOptional()
    cantidad?: number;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    subtotal?: number;

    @IsInt()
    @IsPositive()
    @IsOptional()
    orderId?: number;

    @IsInt()
    @IsPositive()
    @IsOptional()
    servicioId?: number;
}
