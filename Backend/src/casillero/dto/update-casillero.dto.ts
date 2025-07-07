import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { EstadoCasillero } from 'src/common/enums/estadoCasillero.enum';
import { IsNotBlank } from 'src/decorators/is-not-blank-decorator';

export class UpdateCasilleroDto {
  @IsOptional()
  @IsNotBlank({ message: 'El código del casillero no puede estar vacío ni contener solo espacios' })
  @IsString({ message: 'El código del casillero debe ser un texto válido' })
  codigo?: string;

  @IsOptional()
  @IsString({ message: 'La descripción del casillero debe ser un texto' })
  descripcion?: string;

  @IsOptional()
  @IsBoolean({ message: 'El estado debe ser un valor booleano (true o false)' })
  estado?: boolean;

  @IsOptional()
  @IsNumber({}, { message: 'El ID de la orden debe ser un número válido' })
  orderId?: number;


  @IsOptional()
  @IsEnum(EstadoCasillero, { message: 'La situación del casillero debe ser "Disponible" u "Ocupado"' })
  situacion?: EstadoCasillero;
}