import { IsString, IsInt, Min, IsOptional, IsBoolean, IsNumber, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateParteDto {
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  nombre: string;

  @IsOptional()
  @IsString({ message: 'El modelo debe ser un texto' })
  modelo?: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  descripcion?: string;

  @IsOptional()
  @IsString({ message: 'El código interno debe ser un texto' })
  codigoInterno?: string;

  @IsInt({ message: 'La categoría debe ser un número entero' })
  @Min(1, { message: 'ID de categoría inválido' })
  @Type(() => Number)
  categoriaId: number;

  @IsInt({ message: 'La marca debe ser un número entero' })
  @Min(1, { message: 'ID de marca inválido' })
  @Type(() => Number)
  marcaId: number;

  @IsNumber({}, { message: 'El costo debe ser un número' })
  @Min(0)
  @Type(() => Number)
  costo: number;

  @IsNumber({}, { message: 'El precio 1 debe ser un número' })
  @Min(0)
  @Type(() => Number)
  precio1: number;

  @IsNumber({}, { message: 'El precio 2 debe ser un número' })
  @Min(0)
  @Type(() => Number)
  precio2: number;

  @IsNumber({}, { message: 'El precio 3 debe ser un número' })
  @Min(0)
  @Type(() => Number)
  precio3: number;

  @IsNumber({}, { message: 'El precio 4 debe ser un número' })
  @Min(0)
  @Type(() => Number)
  precio4: number;

  @IsNumber({}, { message: 'La tarifa de IVA debe ser un número' })
  @Min(0)
  @Type(() => Number)
  ivaTarifa: number;

  @IsNumber({}, { message: 'El stock debe ser un número' })
  @Min(0)
  @Type(() => Number)
  stock: number;

  @IsNumber({}, { message: 'El stock mínimo debe ser un número' })
  @Min(0)
  @Type(() => Number)
  stockMinimo: number;

  @IsOptional()
  @IsString()
  ubicacion?: string;

  @IsOptional()
  @IsString()
  unidadMedida?: string;

  @IsOptional()
  @IsBoolean()
  permiteModificarPrecio?: boolean;

  @IsOptional()
  @IsBoolean()
  permiteFraccionar?: boolean;

  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}
