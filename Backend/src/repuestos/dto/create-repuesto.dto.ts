import { IsString, IsNotEmpty, IsNumber, IsDecimal, Min, Max, IsInt } from 'class-validator';

export class CreateRepuestoDto {
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @IsString()
  nombre: string;

  @IsString()
  descripcion: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precioVenta: number;

  @IsInt()
  parteId: number;
}
