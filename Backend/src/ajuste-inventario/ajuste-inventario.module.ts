import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AjusteInventarioService } from './ajuste-inventario.service';
import { AjusteInventarioController } from './ajuste-inventario.controller';
import { AjusteInventario } from './entities/ajuste-inventario.entity';
import { AjusteInventarioDetalle } from './entities/ajuste-inventario-detalle.entity';
import { Parte } from '../parte/entities/parte.entity';
import { NotificacionModule } from '../notificacion/notificacion.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AjusteInventario, AjusteInventarioDetalle, Parte]),
    NotificacionModule,
  ],
  controllers: [AjusteInventarioController],
  providers: [AjusteInventarioService],
  exports: [AjusteInventarioService],
})
export class AjusteInventarioModule {}
