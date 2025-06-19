import { Module } from '@nestjs/common';
import { TipoActividadTecnicaService } from './tipo-actividad-tecnica.service';
import { TipoActividadTecnicaController } from './tipo-actividad-tecnica.controller';

@Module({
  controllers: [TipoActividadTecnicaController],
  providers: [TipoActividadTecnicaService],
})
export class TipoActividadTecnicaModule {}
