import { Module } from '@nestjs/common';
import { DetalleRepuestosService } from './detalle-repuestos.service';
import { DetalleRepuestosController } from './detalle-repuestos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from 'src/orders/entities/order.entity';
import { User } from 'src/users/entities/user.entity';
import { DetalleRepuestos } from './entities/detalle-repuesto.entity';
import { Repuesto } from 'src/repuestos/entities/repuesto.entity';
import { Inventario } from 'src/inventario/entities/inventario.entity';
import { InventarioModule } from 'src/inventario/inventario.module';
import { Presupuesto } from 'src/presupuesto/entities/presupuesto.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DetalleRepuestos, Order, User, Repuesto, Inventario,Presupuesto]),
    InventarioModule, 

  ],
  controllers: [DetalleRepuestosController],
  providers: [DetalleRepuestosService],
  exports: [DetalleRepuestosService]

})
export class DetalleRepuestosModule { }
