import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipoNotificacion } from './entities/tipo-notificacion.entity';
import { TipoNotificacionService } from './tipo-notificacion.service';
import { TipoNotificacionController } from './tipo-notificacion.controller';
import { Notificacion } from 'src/notificacion/entities/notificacion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TipoNotificacion,Notificacion])],
  controllers: [TipoNotificacionController],
  providers: [TipoNotificacionService],
  exports: [TypeOrmModule,TipoNotificacionService], 
})
export class TipoNotificacionModule {}
