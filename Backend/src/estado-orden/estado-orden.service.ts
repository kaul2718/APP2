import { Injectable } from '@nestjs/common';
import { CreateEstadoOrdenDto } from './dto/create-estado-orden.dto';
import { UpdateEstadoOrdenDto } from './dto/update-estado-orden.dto';

@Injectable()
export class EstadoOrdenService {
  create(createEstadoOrdenDto: CreateEstadoOrdenDto) {
    return 'This action adds a new estadoOrden';
  }

  findAll() {
    return `This action returns all estadoOrden`;
  }

  findOne(id: number) {
    return `This action returns a #${id} estadoOrden`;
  }

  update(id: number, updateEstadoOrdenDto: UpdateEstadoOrdenDto) {
    return `This action updates a #${id} estadoOrden`;
  }

  remove(id: number) {
    return `This action removes a #${id} estadoOrden`;
  }
}
