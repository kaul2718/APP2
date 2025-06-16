import { Module } from '@nestjs/common';
import { DetalleServiciosService } from './detalle-servicios.service';
import { DetalleServiciosController } from './detalle-servicios.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DetalleRepuestos } from '../detalle-repuestos/entities/detalle-repuesto.entity';
import { Order } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';
import { Repuesto } from '../repuestos/entities/repuesto.entity';
import { DetalleServicio } from './entities/detalle-servicio.entity';
import { Servicio } from 'src/servicios/entities/servicio.entity';

@Module({
  imports: [
          TypeOrmModule.forFeature([DetalleRepuestos,Order,User,Repuesto,DetalleServicio,Servicio])
        ],
  controllers: [DetalleServiciosController],
  providers: [DetalleServiciosService],
  exports: [DetalleServiciosService]
  
})
export class DetalleServiciosModule {}
