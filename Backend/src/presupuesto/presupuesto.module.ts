import { Module } from '@nestjs/common';
import { PresupuestoService } from './presupuesto.service';
import { PresupuestoController } from './presupuesto.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';
import { Presupuesto } from './entities/presupuesto.entity';
import { DetalleRepuestos } from 'src/detalle-repuestos/entities/detalle-repuesto.entity';
import { DetalleServicio } from 'src/detalle-servicios/entities/detalle-servicio.entity';

@Module({
   imports: [
        TypeOrmModule.forFeature([Presupuesto,Order,User,DetalleRepuestos,DetalleServicio])
      ],
  controllers: [PresupuestoController],
  providers: [PresupuestoService],
  exports:[PresupuestoService]
  
})
export class PresupuestoModule {}
