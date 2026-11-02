import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsExportService } from './reports-export.service';
import { ReportsController } from './reports.controller';

import { Order } from '../orders/entities/order.entity';
import { Presupuesto } from '../presupuesto/entities/presupuesto.entity';
import { DetallePresupuestoItem } from '../detalle-presupuesto-item/entities/detalle-presupuesto-item.entity';
import { Parte } from '../parte/entities/parte.entity';
import { User } from '../users/entities/user.entity';
import { Compra } from '../compra/entities/compra.entity';
import { ActividadTecnica } from '../actividad-tecnica/entities/actividad-tecnica.entity';
import { HistorialEstadoOrden } from '../historial-estado-orden/entities/historial-estado-orden.entity';
import { EstadoOrden } from '../estado-orden/entities/estado-orden.entity';
import { EstadoPresupuesto } from '../estado-presupuesto/entities/estado-presupuesto.entity';

import { ConfiguracionSistemaModule } from '../configuracion-sistema/configuracion-sistema.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      Presupuesto,
      DetallePresupuestoItem,
      Parte,
      User,
      Compra,
      ActividadTecnica,
      HistorialEstadoOrden,
      EstadoOrden,
      EstadoPresupuesto,
    ]),
    ConfiguracionSistemaModule,
    StorageModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsExportService],
  exports: [ReportsService, ReportsExportService],
})
export class ReportsModule {}
