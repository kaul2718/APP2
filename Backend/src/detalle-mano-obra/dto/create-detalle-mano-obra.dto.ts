import { IsInt, IsPositive } from 'class-validator';

export class CreateDetalleManoObraDto {
  @IsInt({ message: 'El presupuestoId debe ser un número entero válido.' })
  @IsPositive({ message: 'El presupuestoId debe ser un número positivo.' })
  presupuestoId: number;

  @IsInt({ message: 'El tipoManoObraId debe ser un número entero válido.' })
  @IsPositive({ message: 'El tipoManoObraId debe ser un número positivo.' })
  tipoManoObraId: number;

  @IsInt({ message: 'La cantidad debe ser un número entero válido.' })
  @IsPositive({ message: 'La cantidad debe ser un número positivo.' })
  cantidad: number;
}
