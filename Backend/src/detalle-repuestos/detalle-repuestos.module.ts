import { Module } from '@nestjs/common';
import { DetalleRepuestosService } from './detalle-repuestos.service';
import { DetalleRepuestosController } from './detalle-repuestos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from 'src/orders/entities/order.entity';
import { User } from 'src/users/entities/user.entity';
import { DetalleRepuestos } from './entities/detalle-repuesto.entity';
import { Repuesto } from 'src/repuestos/entities/repuesto.entity';

@Module({
  imports: [
        TypeOrmModule.forFeature([DetalleRepuestos,Order,User,Repuesto])
      ],
  controllers: [DetalleRepuestosController],
  providers: [DetalleRepuestosService],
  exports: [DetalleRepuestosService]
  
})
export class DetalleRepuestosModule {}
