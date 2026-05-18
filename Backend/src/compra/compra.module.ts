import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompraService } from './compra.service';
import { CompraController } from './compra.controller';
import { Compra } from './entities/compra.entity';
import { CompraDetalle } from './entities/compra-detalle.entity';
import { Parte } from '../parte/entities/parte.entity';
import { Proveedor } from '../proveedor/entities/proveedor.entity';
import { NotificacionModule } from '../notificacion/notificacion.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Compra, CompraDetalle, Parte, Proveedor]),
    NotificacionModule,
  ],
  controllers: [CompraController],
  providers: [CompraService],
  exports: [CompraService],
})
export class CompraModule {}
