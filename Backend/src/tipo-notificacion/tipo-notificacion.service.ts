import { Injectable } from '@nestjs/common';
import { CreateTipoNotificacionDto } from './dto/create-tipo-notificacion.dto';
import { UpdateTipoNotificacionDto } from './dto/update-tipo-notificacion.dto';

@Injectable()
export class TipoNotificacionService {
  create(createTipoNotificacionDto: CreateTipoNotificacionDto) {
    return 'This action adds a new tipoNotificacion';
  }

  findAll() {
    return `This action returns all tipoNotificacion`;
  }

  findOne(id: number) {
    return `This action returns a #${id} tipoNotificacion`;
  }

  update(id: number, updateTipoNotificacionDto: UpdateTipoNotificacionDto) {
    return `This action updates a #${id} tipoNotificacion`;
  }

  remove(id: number) {
    return `This action removes a #${id} tipoNotificacion`;
  }
}
