import { Module } from '@nestjs/common';
import { HistorialEstadoOrdenService } from './historial-estado-orden.service';
import { HistorialEstadoOrdenController } from './historial-estado-orden.controller';

@Module({
  controllers: [HistorialEstadoOrdenController],
  providers: [HistorialEstadoOrdenService],
})
export class HistorialEstadoOrdenModule {}
