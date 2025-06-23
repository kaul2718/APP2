import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvidenciaTecnica } from './entities/evidencia-tecnica.entity';
import { EvidenciaTecnicaService } from './evidencia-tecnica.service';
import { EvidenciaTecnicaController } from './evidencia-tecnica.controller';
import { Order } from '../orders/entities/order.entity'; 
import { User } from '../users/entities/user.entity';     

@Module({
  imports: [
    TypeOrmModule.forFeature([EvidenciaTecnica, Order, User]), 
  ],
  controllers: [EvidenciaTecnicaController],
  providers: [EvidenciaTecnicaService],
})
export class EvidenciaTecnicaModule {}
