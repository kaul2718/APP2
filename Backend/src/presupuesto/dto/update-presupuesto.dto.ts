import { IsNumber, IsOptional, IsString, MaxLength, IsEnum, Min } from 'class-validator';
import { EstadoPresupuesto } from '../../common/enums/estadoPresupuesto.enum';
export class UpdatePresupuestoDto {
  @IsOptional()
  @IsNumber()
  @Min(0)  // Permite que el valor sea 0 o mayor
  costoManoObra?: number; // Permite actualizar el costo de la mano de obra

  @IsOptional()
  @IsNumber()
  @Min(0)  // Permite que el valor sea 0 o mayor
  costoRepuesto?: number; // Permite actualizar el costo de los repuestos

  @IsOptional()
  @IsEnum(EstadoPresupuesto)
  estado?: EstadoPresupuesto; // Permite actualizar el estado del presupuesto

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string; // Permite actualizar la descripción
}