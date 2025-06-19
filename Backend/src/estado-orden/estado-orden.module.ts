import { Module } from '@nestjs/common';
import { EstadoOrdenService } from './estado-orden.service';
import { EstadoOrdenController } from './estado-orden.controller';

@Module({
  controllers: [EstadoOrdenController],
  providers: [EstadoOrdenService],
})
export class EstadoOrdenModule {}
