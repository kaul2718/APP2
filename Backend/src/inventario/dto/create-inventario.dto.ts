import { IsInt, Min, IsString, IsNotEmpty, IsBoolean, IsOptional, IsNumber, } from 'class-validator';

export class CreateInventarioDto {
  /**
     * Debe ser un número entero igual o mayor a 0.
     */
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(0, { message: 'La cantidad no puede ser negativa' })
  cantidad: number;

  /**
   * ✅ Stock mínimo permitido antes de considerarlo bajo.
   * Debe ser un número entero igual o mayor a 0.
   */
  @IsInt({ message: 'El stock mínimo debe ser un número entero' })
  @Min(0, { message: 'El stock mínimo no puede ser negativo' })
  stockMinimo: number;

  /**
   * 🔁 Estado opcional del inventario (activo/inactivo).
   * Si se proporciona, debe ser un valor booleano.
   */
  @IsOptional()
  @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
  estado?: boolean;

  /**
   * 📍 Ubicación física del inventario.
   * Campo obligatorio, debe ser texto no vacío.
   */
  @IsString({ message: 'La ubicación debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La ubicación no puede estar vacía' })
  ubicacion: string;

  /**
   * 🔗 ID de la parte a la que pertenece este inventario.
   * Campo obligatorio, debe ser un número entero mayor a 0.
   */
  @IsNumber({}, { message: 'La parte debe ser un número' })
  @IsInt({ message: 'La parte debe ser un número entero' })
  @Min(1, { message: 'Debe seleccionar una parte válida' })
  parteId: number;
}
