import { Module } from '@nestjs/common';
import { ActividadTecnicaService } from './actividad-tecnica.service';
import { ActividadTecnicaController } from './actividad-tecnica.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from 'src/orders/entities/order.entity';
import { User } from 'src/users/entities/user.entity';
import { ActividadTecnica } from './entities/actividad-tecnica.entity';

@Module({
  imports: [
        TypeOrmModule.forFeature([ActividadTecnica,Order,User])
      ],
  controllers: [ActividadTecnicaController],
  providers: [ActividadTecnicaService],
  exports:[ActividadTecnicaService]
})
export class ActividadTecnicaModule {}
