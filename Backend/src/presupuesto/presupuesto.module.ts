import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Presupuesto } from './entities/presupuesto.entity';
import { AutorizacionPresupuesto } from './entities/autorizacion-presupuesto.entity';
import { PresupuestoService } from './presupuesto.service';
import { PresupuestoController } from './presupuesto.controller';
import { Order } from 'src/orders/entities/order.entity';
import { EstadoPresupuesto } from 'src/estado-presupuesto/entities/estado-presupuesto.entity';
import { DetallePresupuestoItem } from 'src/detalle-presupuesto-item/entities/detalle-presupuesto-item.entity';
import { Parte } from 'src/parte/entities/parte.entity';
import { User } from 'src/users/entities/user.entity';
import { HistorialEstadoOrden } from 'src/historial-estado-orden/entities/historial-estado-orden.entity';
import { NotificacionModule } from '../notificacion/notificacion.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Presupuesto,
      AutorizacionPresupuesto,
      Order,
      EstadoPresupuesto,
      DetallePresupuestoItem,
      Parte,
      User,
      HistorialEstadoOrden,
    ]),
    NotificacionModule,
  ],
  controllers: [PresupuestoController],
  providers: [PresupuestoService],
  exports: [PresupuestoService],
})
export class PresupuestoModule { }
