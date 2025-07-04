import { Module } from '@nestjs/common';
import { ParteService } from './parte.service';
import { ParteController } from './parte.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Parte } from './entities/parte.entity';
import { Categoria } from 'src/categoria/entities/categoria.entity';
import { EspecificacionParte } from 'src/especificacion-parte/entities/especificacion-parte.entity';
import { Marca } from 'src/marca/entities/marca.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Parte,Categoria,EspecificacionParte,Marca])],
  controllers: [ParteController],
  providers: [ParteService],
  exports: [TypeOrmModule],
})
export class ParteModule {}
