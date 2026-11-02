import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfiguracionSistema } from './entities/configuracion-sistema.entity';
import { ConfiguracionSistemaService } from './configuracion-sistema.service';
import { ConfiguracionSistemaController } from './configuracion-sistema.controller';
import { Order } from '../orders/entities/order.entity';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConfiguracionSistema, Order]),
    StorageModule,
  ],
  controllers: [ConfiguracionSistemaController],
  providers: [ConfiguracionSistemaService],
  exports: [ConfiguracionSistemaService],
})
export class ConfiguracionSistemaModule {}
