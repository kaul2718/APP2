import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstadoOrdenService } from './estado-orden.service';
import { EstadoOrdenController } from './estado-orden.controller';
import { EstadoOrden } from './entities/estado-orden.entity';
import { Order } from 'src/orders/entities/order.entity';
import { HistorialEstadoOrden } from 'src/historial-estado-orden/entities/historial-estado-orden.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EstadoOrden,
      Order,
      HistorialEstadoOrden, // para manejar relaciones
    ]),
  ],
  controllers: [EstadoOrdenController],
  providers: [EstadoOrdenService],
  exports: [TypeOrmModule,EstadoOrdenService], // si se necesita usar en otros módulos
})
export class EstadoOrdenModule {}
