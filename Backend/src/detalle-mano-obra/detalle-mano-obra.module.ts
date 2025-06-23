import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DetalleManoObraService } from './detalle-mano-obra.service';
import { DetalleManoObraController } from './detalle-mano-obra.controller';
import { DetalleManoObra } from './entities/detalle-mano-obra.entity';
import { TipoManoObra } from 'src/tipo-mano-obra/entities/tipo-mano-obra.entity';
import { Presupuesto } from 'src/presupuesto/entities/presupuesto.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DetalleManoObra, TipoManoObra,Presupuesto]),
  ],
  controllers: [DetalleManoObraController],
  providers: [DetalleManoObraService],
  exports: [TypeOrmModule], 
})
export class DetalleManoObraModule {}
