import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentoOrden } from './entities/documento-orden.entity';
import { Order } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';
import { DocumentosOrdenService } from './documentos-orden.service';
import { DocumentosOrdenController } from './documentos-orden.controller';
import { StorageModule } from '../storage/storage.module';
import { FirmaElectronicaModule } from '../firma-electronica/firma-electronica.module';
import { ConfiguracionSistemaModule } from '../configuracion-sistema/configuracion-sistema.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentoOrden, Order, User]),
    StorageModule,
    FirmaElectronicaModule,
    ConfiguracionSistemaModule,
  ],
  controllers: [DocumentosOrdenController],
  providers: [DocumentosOrdenService],
  exports: [DocumentosOrdenService],
})
export class DocumentosOrdenModule {}
