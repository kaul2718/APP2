import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipoActividadTecnica } from './entities/tipo-actividad-tecnica.entity';
import { TipoActividadTecnicaService } from './tipo-actividad-tecnica.service';
import { TipoActividadTecnicaController } from './tipo-actividad-tecnica.controller';
import { ActividadTecnica } from 'src/actividad-tecnica/entities/actividad-tecnica.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TipoActividadTecnica,ActividadTecnica])],
  controllers: [TipoActividadTecnicaController],
  providers: [TipoActividadTecnicaService],
  exports: [TipoActividadTecnicaService], 
})
export class TipoActividadTecnicaModule {}
