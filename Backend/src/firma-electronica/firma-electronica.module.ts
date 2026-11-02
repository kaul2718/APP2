import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FirmaElectronicaConfig } from './entities/firma-electronica-config.entity';
import { FirmaElectronicaService } from './firma-electronica.service';
import { FirmaElectronicaController } from './firma-electronica.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FirmaElectronicaConfig])],
  controllers: [FirmaElectronicaController],
  providers: [FirmaElectronicaService],
  exports: [FirmaElectronicaService],
})
export class FirmaElectronicaModule {}
