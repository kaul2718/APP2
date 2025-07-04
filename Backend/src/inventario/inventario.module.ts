import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventario } from './entities/inventario.entity';
import { InventarioService } from './inventario.service';
import { InventarioController } from './inventario.controller';
import { Parte } from 'src/parte/entities/parte.entity';
import { ParteModule } from 'src/parte/parte.module';

@Module({
  imports: [TypeOrmModule.forFeature([Inventario, Parte]),
    ParteModule,
  ],
  controllers: [InventarioController],
  providers: [InventarioService],
  exports: [TypeOrmModule],

})
export class InventarioModule { }
