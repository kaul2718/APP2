import { IsString, IsInt, Min } from 'class-validator';

export class CreateParteDto {
  @IsInt()
  @Min(1)
  categoriaId: number;

  @IsInt()
  @Min(1)
  marcaId: number;

  @IsString()
  modelo: string;

  @IsString()
  descripcion: string;

}
