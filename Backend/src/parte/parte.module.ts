import { Module } from '@nestjs/common';
import { ParteService } from './parte.service';
import { ParteController } from './parte.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Parte } from './entities/parte.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Parte])],
  controllers: [ParteController],
  providers: [ParteService],
  exports: [TypeOrmModule],
})
export class ParteModule {}
