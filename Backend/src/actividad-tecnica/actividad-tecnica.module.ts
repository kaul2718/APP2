import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActividadTecnica } from './entities/actividad-tecnica.entity';
import { ActividadTecnicaService } from './actividad-tecnica.service';
import { ActividadTecnicaController } from './actividad-tecnica.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ActividadTecnica])],
  providers: [ActividadTecnicaService],
  controllers: [ActividadTecnicaController],
})
export class ActividadTecnicaModule {}
