import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Order } from 'src/orders/entities/order.entity';
import { Presupuesto } from 'src/presupuesto/entities/presupuesto.entity';
import { Notificacion } from 'src/notificacion/entities/notificacion.entity';
import { Inventario } from 'src/inventario/entities/inventario.entity';
import { ActividadTecnica } from 'src/actividad-tecnica/entities/actividad-tecnica.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      Presupuesto,
      Notificacion,
      Inventario,
      ActividadTecnica,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
