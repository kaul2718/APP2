import { Injectable } from '@nestjs/common';
import { CreateNotificacionDto } from './dto/create-notificacion.dto';
import { UpdateNotificacionDto } from './dto/update-notificacion.dto';

@Injectable()
export class NotificacionService {
  create(createNotificacionDto: CreateNotificacionDto) {
    return 'This action adds a new notificacion';
  }

  findAll() {
    return `This action returns all notificacion`;
  }

  findOne(id: number) {
    return `This action returns a #${id} notificacion`;
  }

  update(id: number, updateNotificacionDto: UpdateNotificacionDto) {
    return `This action updates a #${id} notificacion`;
  }

  remove(id: number) {
    return `This action removes a #${id} notificacion`;
  }
}
