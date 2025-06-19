import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipoEspecificacionService } from './tipo-especificacion.service';
import { TipoEspecificacionController } from './tipo-especificacion.controller';
import { TipoEspecificacion } from './entities/tipo-especificacion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TipoEspecificacion])],
  controllers: [TipoEspecificacionController],
  providers: [TipoEspecificacionService],
})
export class TipoEspecificacionModule {}
