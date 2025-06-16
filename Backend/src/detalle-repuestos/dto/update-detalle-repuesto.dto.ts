import { PartialType } from '@nestjs/mapped-types';
import { CreateDetalleRepuestoDto } from './create-detalle-repuesto.dto';
import { IsDecimal, IsInt, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class UpdateDetalleRepuestoDto extends PartialType(CreateDetalleRepuestoDto) {
    @IsOptional()
    @IsNumber()
    @IsInt()
    @IsPositive()
    cantidad?: number;
  
    @IsOptional()
    @IsNumber()
    @IsPositive()
    precioUnitario?: number;
  
    @IsOptional()
    @IsNumber()
    @IsPositive()
    subtotal?: number;
  
    @IsOptional()
    @IsInt()
    @IsPositive()
    orderId?: number;
  
    @IsOptional()
    @IsInt()
    @IsPositive()
    repuestoId?: number;
  }