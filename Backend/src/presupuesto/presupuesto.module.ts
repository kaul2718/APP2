import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Presupuesto } from './entities/presupuesto.entity';
import { PresupuestoService } from './presupuesto.service';
import { PresupuestoController } from './presupuesto.controller';
import { Order } from 'src/orders/entities/order.entity';
import { EstadoPresupuesto } from 'src/estado-presupuesto/entities/estado-presupuesto.entity';
import { DetalleRepuestos } from 'src/detalle-repuestos/entities/detalle-repuesto.entity';
import { Inventario } from 'src/inventario/entities/inventario.entity';
import { Repuesto } from 'src/repuestos/entities/repuesto.entity';
import { InventarioModule } from 'src/inventario/inventario.module'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Presupuesto,
      Order,
      EstadoPresupuesto,
      DetalleRepuestos,
      Inventario,
      Repuesto,
    ]),
    InventarioModule, 
  ],
  controllers: [PresupuestoController],
  providers: [PresupuestoService],
})
export class PresupuestoModule {}
