import { Module } from '@nestjs/common';
import { CasilleroService } from './casillero.service';
import { CasilleroController } from './casillero.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from 'src/orders/entities/order.entity';
import { User } from 'src/users/entities/user.entity';
import { Casillero } from './entities/casillero.entity';

@Module({
   imports: [
        TypeOrmModule.forFeature([Casillero,Order,User,])
      ],
  controllers: [CasilleroController],
  providers: [CasilleroService],
  exports: [CasilleroService]
  
})
export class CasilleroModule {}
