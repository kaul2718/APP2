import { Module } from '@nestjs/common';
import { DetalleManoObraService } from './detalle-mano-obra.service';
import { DetalleManoObraController } from './detalle-mano-obra.controller';

@Module({
  controllers: [DetalleManoObraController],
  providers: [DetalleManoObraService],
})
export class DetalleManoObraModule {}
