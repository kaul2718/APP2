import { Module } from '@nestjs/common';
import { EquipoService } from './equipo.service';
import { EquipoController } from './equipo.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from 'src/orders/entities/order.entity';
import { User } from 'src/users/entities/user.entity';
import { Equipo } from './entities/equipo.entity';

@Module({
  imports: [
        TypeOrmModule.forFeature([Order,User,Equipo])
      ],
  controllers: [EquipoController],
  providers: [EquipoService],
})
export class EquipoModule {}
