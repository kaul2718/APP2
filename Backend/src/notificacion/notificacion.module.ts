import { Module } from '@nestjs/common';
import { NotificacionService } from './notificacion.service';
import { NotificacionController } from './notificacion.controller';

@Module({
  controllers: [NotificacionController],
  providers: [NotificacionService],
})
export class NotificacionModule {}
