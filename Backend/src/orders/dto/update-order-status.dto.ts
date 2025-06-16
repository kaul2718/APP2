import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EstadoOrden } from 'src/common/enums/estadoOrden.enum';
import { EstadoFinal } from 'src/common/enums/estadoFinalOrden';

export class UpdateOrderStatusDto extends PartialType(CreateOrderDto) {
  @IsEnum(EstadoOrden)
  Estado: EstadoOrden; // Estado que ingresa (Revisión, Reparación, Pendiente, Reparación terminada)

  @IsEnum(EstadoFinal)
  @IsOptional()
  EstadoFinal?: EstadoFinal;// Estado final de la orden (Entregado, No Entregado)
}