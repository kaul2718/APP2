import { Module } from '@nestjs/common';
import { RepuestosService } from './repuestos.service';
import { RepuestosController } from './repuestos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DetalleRepuestos } from 'src/detalle-repuestos/entities/detalle-repuesto.entity';
import { Order } from 'src/orders/entities/order.entity';
import { User } from 'src/users/entities/user.entity';
import { Repuesto } from './entities/repuesto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DetalleRepuestos, Order, User, Repuesto])],
  controllers: [RepuestosController],
  providers: [RepuestosService],
  exports: [RepuestosService] // Solo se exportan los servicios, no las entidades
})
export class RepuestosModule {}
