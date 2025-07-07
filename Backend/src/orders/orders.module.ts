import { Module } from '@nestjs/common';
import { OrderService } from './orders.service';
import { OrderController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { User } from '../users/entities/user.entity';
import { Casillero } from '../casillero/entities/casillero.entity';
import { Equipo } from '../equipo/entities/equipo.entity';
import { EvidenciaTecnica } from 'src/evidencia-tecnica/entities/evidencia-tecnica.entity';
import { EstadoOrden } from 'src/estado-orden/entities/estado-orden.entity';
import { EstadoOrdenModule } from 'src/estado-orden/estado-orden.module';
import { HistorialEstadoOrden } from 'src/historial-estado-orden/entities/historial-estado-orden.entity';
import { Presupuesto } from 'src/presupuesto/entities/presupuesto.entity';
import { ActividadTecnica } from 'src/actividad-tecnica/entities/actividad-tecnica.entity';
import { DetalleManoObra } from 'src/detalle-mano-obra/entities/detalle-mano-obra.entity';
import { DetalleRepuestos } from 'src/detalle-repuestos/entities/detalle-repuesto.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([Order,EstadoOrden,User,Equipo,EvidenciaTecnica,Casillero,HistorialEstadoOrden,Presupuesto,ActividadTecnica,DetalleManoObra,DetalleRepuestos]),
    EstadoOrdenModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrdersModule { }
