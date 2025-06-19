import { Module } from '@nestjs/common';
import { ModeloService } from './modelo.service';
import { ModeloController } from './modelo.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Modelo } from './entities/modelo.entity';
import { Marca } from 'src/marca/entities/marca.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Modelo,Marca])],
  controllers: [ModeloController],
  providers: [ModeloService],
})
export class ModeloModule {}
