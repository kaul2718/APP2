import { Module } from '@nestjs/common';
import { DetallePresupuestoItemService } from './detalle-presupuesto-item.service';
import { DetallePresupuestoItemController } from './detalle-presupuesto-item.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DetallePresupuestoItem } from './entities/detalle-presupuesto-item.entity';
import { Inventario } from 'src/inventario/entities/inventario.entity';
import { InventarioModule } from 'src/inventario/inventario.module';
import { Presupuesto } from 'src/presupuesto/entities/presupuesto.entity';
import { Parte } from 'src/parte/entities/parte.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DetallePresupuestoItem, Inventario, Presupuesto, Parte]),
    InventarioModule, 

  ],
  controllers: [DetallePresupuestoItemController],
  providers: [DetallePresupuestoItemService],
  exports: [DetallePresupuestoItemService]

})
export class DetallePresupuestoItemModule { }
