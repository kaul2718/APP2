import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EquipoService } from './equipo.service';
import { EquipoController } from './equipo.controller';
import { Equipo } from './entities/equipo.entity';
import { Order } from '../orders/entities/order.entity';
import { TipoEquipo } from '../tipo-equipo/entities/tipo-equipo.entity'; 
import { Marca } from '../marca/entities/marca.entity';
import { Modelo } from '../modelo/entities/modelo.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Equipo, Order, TipoEquipo, Marca, Modelo]), // <-- AGREGAR LAS ENTITYS
  ],
  providers: [EquipoService],
  controllers: [EquipoController],
  exports: [EquipoService],
})
export class EquipoModule {}
