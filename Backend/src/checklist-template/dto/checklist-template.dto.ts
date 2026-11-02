import { IsString, IsNotEmpty, IsArray, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateChecklistTemplateDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsNumber()
  @IsNotEmpty()
  tipoEquipoId: number;

  @IsNotEmpty()
  items: any;
}

export class UpdateChecklistTemplateDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsNumber()
  @IsOptional()
  tipoEquipoId?: number;

  @IsOptional()
  items?: any;

  @IsBoolean()
  @IsOptional()
  estado?: boolean;
}

