// src/categoria/dto/create-categoria.dto.ts
import { IsString } from 'class-validator';

export class CreateCategoriaDto {
  @IsString()
  nombre: string;
  @IsString()
  descripcion: string;
}
