import { IsString, IsNotEmpty, IsArray, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateChecklistTemplateDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsNumber()
  @IsNotEmpty()
  tipoEquipoId: number;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  items: string[];
}

export class UpdateChecklistTemplateDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsNumber()
  @IsOptional()
  tipoEquipoId?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  items?: string[];

  @IsBoolean()
  @IsOptional()
  estado?: boolean;
}
