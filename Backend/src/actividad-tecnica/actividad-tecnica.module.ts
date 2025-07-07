import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActividadTecnica } from './entities/actividad-tecnica.entity';
import { ActividadTecnicaService } from './actividad-tecnica.service';
import { ActividadTecnicaController } from './actividad-tecnica.controller';
import { Order } from 'src/orders/entities/order.entity';
import { TipoActividadTecnica } from 'src/tipo-actividad-tecnica/entities/tipo-actividad-tecnica.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ActividadTecnica,Order,TipoActividadTecnica])],
  providers: [ActividadTecnicaService],
  controllers: [ActividadTecnicaController],
})
export class ActividadTecnicaModule {}
