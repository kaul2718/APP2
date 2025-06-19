import { Module } from '@nestjs/common';
import { TipoNotificacionService } from './tipo-notificacion.service';
import { TipoNotificacionController } from './tipo-notificacion.controller';

@Module({
  controllers: [TipoNotificacionController],
  providers: [TipoNotificacionService],
})
export class TipoNotificacionModule {}
