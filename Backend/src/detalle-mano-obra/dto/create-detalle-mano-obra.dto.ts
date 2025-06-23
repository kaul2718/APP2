import { IsInt, IsPositive, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateDetalleManoObraDto {
  @IsInt()
  @IsPositive()
  presupuestoId: number;

  @IsInt()
  @IsPositive()
  tipoManoObraId: number;

  @IsInt()
  @IsPositive()
  cantidad: number;

 
}
