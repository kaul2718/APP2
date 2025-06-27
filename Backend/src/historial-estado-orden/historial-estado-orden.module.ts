import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistorialEstadoOrdenService } from './historial-estado-orden.service';
import { HistorialEstadoOrdenController } from './historial-estado-orden.controller';
import { HistorialEstadoOrden } from './entities/historial-estado-orden.entity';
import { Order } from 'src/orders/entities/order.entity';
import { EstadoOrden } from 'src/estado-orden/entities/estado-orden.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([HistorialEstadoOrden, Order, EstadoOrden, User]),
  ],
  controllers: [HistorialEstadoOrdenController],
  providers: [HistorialEstadoOrdenService],
  exports: [HistorialEstadoOrdenService],
})
export class HistorialEstadoOrdenModule {}
