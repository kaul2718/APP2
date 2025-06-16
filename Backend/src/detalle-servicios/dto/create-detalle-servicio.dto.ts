import { IsInt, IsNotEmpty, IsNumber, IsPositive } from "class-validator";

export class CreateDetalleServicioDto {
    @IsInt()
    @IsPositive()
    @IsNotEmpty()
    cantidad: number;

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    subtotal: number;

    @IsInt()
    @IsPositive()
    @IsNotEmpty()
    orderId: number;

    @IsInt()
    @IsPositive()
    @IsNotEmpty()
    servicioId: number;
}
