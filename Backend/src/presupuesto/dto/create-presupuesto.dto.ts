import { IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from "class-validator";
import { EstadoPresupuesto } from "src/common/enums/estadoPresupuesto.enum";

export class CreatePresupuestoDto {

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @IsNumber()
  orderId: number;
}