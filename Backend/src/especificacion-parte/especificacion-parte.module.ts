import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EspecificacionParteService } from './especificacion-parte.service';
import { EspecificacionParteController } from './especificacion-parte.controller';
import { EspecificacionParte } from './entities/especificacion-parte.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EspecificacionParte])],
  controllers: [EspecificacionParteController],
  providers: [EspecificacionParteService],
})
export class EspecificacionParteModule {}
