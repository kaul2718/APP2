import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EspecificacionParteService } from './especificacion-parte.service';
import { EspecificacionParteController } from './especificacion-parte.controller';
import { EspecificacionParte } from './entities/especificacion-parte.entity';
import { Parte } from 'src/parte/entities/parte.entity';
import { TipoEspecificacion } from 'src/tipo-especificacion/entities/tipo-especificacion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EspecificacionParte,Parte,TipoEspecificacion])],
  controllers: [EspecificacionParteController],
  providers: [EspecificacionParteService],
})
export class EspecificacionParteModule {}
