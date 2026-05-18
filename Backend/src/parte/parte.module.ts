import { Module } from '@nestjs/common';
import { ParteService } from './parte.service';
import { ParteController } from './parte.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Parte } from './entities/parte.entity';
import { Categoria } from 'src/categoria/entities/categoria.entity';
import { Marca } from 'src/marca/entities/marca.entity';
import { NotificacionModule } from 'src/notificacion/notificacion.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Parte, Categoria, Marca]),
    NotificacionModule,
  ],
  controllers: [ParteController],
  providers: [ParteService],
  exports: [TypeOrmModule, ParteService],
})
export class ParteModule {}
