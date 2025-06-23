import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipoManoObraService } from './tipo-mano-obra.service';
import { TipoManoObraController } from './tipo-mano-obra.controller';
import { TipoManoObra } from './entities/tipo-mano-obra.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TipoManoObra])],
  controllers: [TipoManoObraController],
  providers: [TipoManoObraService],
  exports: [TypeOrmModule],
})
export class TipoManoObraModule {}
