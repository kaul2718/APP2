import { Module } from '@nestjs/common';
import { TipoManoObraService } from './tipo-mano-obra.service';
import { TipoManoObraController } from './tipo-mano-obra.controller';

@Module({
  controllers: [TipoManoObraController],
  providers: [TipoManoObraService],
})
export class TipoManoObraModule {}
