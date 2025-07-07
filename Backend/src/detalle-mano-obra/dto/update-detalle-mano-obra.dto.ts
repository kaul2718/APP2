import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsPositive, IsOptional, isBoolean, IsBoolean } from 'class-validator';
import { CreateDetalleManoObraDto } from './create-detalle-mano-obra.dto';

export class UpdateDetalleManoObraDto extends PartialType(CreateDetalleManoObraDto) {
  @IsOptional()
  @IsInt({ message: 'El tipoManoObraId debe ser un número entero válido.' })
  @IsPositive({ message: 'El tipoManoObraId debe ser un número positivo.' })
  tipoManoObraId?: number;

  @IsOptional()
  @IsInt({ message: 'La cantidad debe ser un número entero válido.' })
  @IsPositive({ message: 'La cantidad debe ser un número positivo.' })
  cantidad?: number;

  @IsOptional()
  @IsBoolean({ message: 'El estado debe ser un valor booleano (verdadero/falso)' })
  estado?: boolean;
}
