import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsNotBlank } from 'src/decorators/is-not-blank-decorator';

export class UpdateEstadoPresupuestoDto {
  @IsNotBlank({ message: 'El nombre del estado de presupuesto no puede estar vacío' })
  @IsString({ message: 'El nombre del estado de presupuesto debe ser un texto' })
  nombre?: string;

  @IsOptional()
  @IsBoolean({ message: 'El estado debe ser un valor booleano (verdadero/falso)' })
  estado?: boolean;

  @IsString({ message: 'La descripción debe ser un texto' })
  @IsNotEmpty({ message: 'La descripción no puede estar vacía' })
  descripcion?: string;
}