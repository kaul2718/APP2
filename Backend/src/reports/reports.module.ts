import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Order } from 'src/orders/entities/order.entity';
import { Presupuesto } from 'src/presupuesto/entities/presupuesto.entity';
import { Parte } from 'src/parte/entities/parte.entity';
import { User } from 'src/users/entities/user.entity';
import { Compra } from 'src/compra/entities/compra.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Presupuesto, Parte, User, Compra]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
