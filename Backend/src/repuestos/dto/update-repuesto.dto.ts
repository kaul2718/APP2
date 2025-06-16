import { PartialType } from '@nestjs/mapped-types';
import { IsDate, IsDateString, IsDecimal, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from "class-validator";
import { CreateRepuestoDto } from './create-repuesto.dto';

export class UpdateRepuestoDto extends PartialType(CreateRepuestoDto) {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    codigo?: string;
  
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    nombre?: string;
  
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    descripcion?: string;
  
    @IsNumber()
    @Min(0)
    @IsOptional()
    precioVenta?: number;
  
    @IsNumber()
    @Min(0)
    @IsOptional()
    stockActual?: number;
  
    @IsNumber()
    @Min(0)
    @IsOptional()
    stockMinimo?: number;
  }