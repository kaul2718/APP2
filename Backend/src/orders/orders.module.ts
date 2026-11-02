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
import { AutorizacionPresupuesto } from 'src/presupuesto/entities/autorizacion-presupuesto.entity';
import { ActividadTecnica } from 'src/actividad-tecnica/entities/actividad-tecnica.entity';
import { DocumentoOrden } from '../documentos-orden/entities/documento-orden.entity';
import { NotificacionModule } from '../notificacion/notificacion.module';
import { PresupuestoModule } from 'src/presupuesto/presupuesto.module';
import { DocumentosOrdenModule } from '../documentos-orden/documentos-orden.module';
import { ConfiguracionSistemaModule } from '../configuracion-sistema/configuracion-sistema.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      EstadoOrden,
      User,
      Equipo,
      EvidenciaTecnica,
      Casillero,
      HistorialEstadoOrden,
      Presupuesto,
      AutorizacionPresupuesto,
      ActividadTecnica,
      DocumentoOrden,
    ]),
    EstadoOrdenModule,
    NotificacionModule,
    PresupuestoModule,
    ConfiguracionSistemaModule,
    DocumentosOrdenModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrdersModule { }
