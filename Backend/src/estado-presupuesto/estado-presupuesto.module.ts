import { Module } from '@nestjs/common';
import { EstadoPresupuestoService } from './estado-presupuesto.service';
import { EstadoPresupuestoController } from './estado-presupuesto.controller';

@Module({
  controllers: [EstadoPresupuestoController],
  providers: [EstadoPresupuestoService],
})
export class EstadoPresupuestoModule {}
