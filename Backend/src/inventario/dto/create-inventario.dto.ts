import {IsInt,Min,IsString,IsNotEmpty,} from 'class-validator';

export class CreateInventarioDto {
  @IsInt()
  @Min(0)
  cantidad: number;

  @IsInt()
  @Min(0)
  stockMinimo: number;

  @IsString()
  @IsNotEmpty()
  ubicacion: string;

  @IsInt()
  @Min(1)
  parteId: number;
}
