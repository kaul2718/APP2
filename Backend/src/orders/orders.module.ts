import { Module } from '@nestjs/common';
import { OrderService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { User } from '../users/entities/user.entity';
import { Casillero } from '../casillero/entities/casillero.entity';
import { Equipo } from '../equipo/entities/equipo.entity';
import { DataSource } from 'typeorm';
import { EvidenciaTecnica } from 'src/evidencia-tecnica/entities/evidencia-tecnica.entity';


@Module({
  imports: [
      TypeOrmModule.forFeature([Order,User,Casillero,Equipo,EvidenciaTecnica])
    ],
  controllers: [OrdersController],
  providers: [OrderService],
  exports: [OrderService]
})
export class OrdersModule {}
