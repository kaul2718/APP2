import { PartialType } from '@nestjs/mapped-types';
import { CreateDetalleRepuestoDto } from './create-detalle-repuesto.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EstadoDetalleRepuesto } from 'src/common/enums/estadoDetalleRepuesto';

export class UpdateDetalleRepuestoDto extends PartialType(CreateDetalleRepuestoDto) {
  @IsOptional()
  @IsEnum(EstadoDetalleRepuesto)
  estado?: EstadoDetalleRepuesto;

  @IsOptional()
  @IsString()
  comentario?: string;
}
