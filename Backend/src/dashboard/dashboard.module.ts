import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Order } from '../orders/entities/order.entity';
import { Presupuesto } from '../presupuesto/entities/presupuesto.entity';
import { Notificacion } from '../notificacion/entities/notificacion.entity';
import { Parte } from '../parte/entities/parte.entity';
import { ActividadTecnica } from '../actividad-tecnica/entities/actividad-tecnica.entity';
import { HistorialEstadoOrden } from '../historial-estado-orden/entities/historial-estado-orden.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      Presupuesto,
      Notificacion,
      Parte,
      ActividadTecnica,
      HistorialEstadoOrden,
      User,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
