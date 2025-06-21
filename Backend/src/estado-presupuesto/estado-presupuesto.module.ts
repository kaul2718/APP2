import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstadoPresupuesto } from './entities/estado-presupuesto.entity';
import { EstadoPresupuestoService } from './estado-presupuesto.service';
import { EstadoPresupuestoController } from './estado-presupuesto.controller';
import { Presupuesto } from 'src/presupuesto/entities/presupuesto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EstadoPresupuesto,Presupuesto])],
  controllers: [EstadoPresupuestoController],
  providers: [EstadoPresupuestoService],
  exports: [TypeOrmModule],
})
export class EstadoPresupuestoModule {}
