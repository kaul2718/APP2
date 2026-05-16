import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Presupuesto } from './entities/presupuesto.entity';
import { PresupuestoService } from './presupuesto.service';
import { PresupuestoController } from './presupuesto.controller';
import { Order } from 'src/orders/entities/order.entity';
import { EstadoPresupuesto } from 'src/estado-presupuesto/entities/estado-presupuesto.entity';
import { DetallePresupuestoItem } from 'src/detalle-presupuesto-item/entities/detalle-presupuesto-item.entity';
import { Parte } from 'src/parte/entities/parte.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Presupuesto,
      Order,
      EstadoPresupuesto,
      DetallePresupuestoItem,
      Parte,
    ]),
  ],
  controllers: [PresupuestoController],
  providers: [PresupuestoService],
})
export class PresupuestoModule { }
