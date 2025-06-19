import { Injectable } from '@nestjs/common';
import { CreateHistorialEstadoOrdenDto } from './dto/create-historial-estado-orden.dto';
import { UpdateHistorialEstadoOrdenDto } from './dto/update-historial-estado-orden.dto';

@Injectable()
export class HistorialEstadoOrdenService {
  create(createHistorialEstadoOrdenDto: CreateHistorialEstadoOrdenDto) {
    return 'This action adds a new historialEstadoOrden';
  }

  findAll() {
    return `This action returns all historialEstadoOrden`;
  }

  findOne(id: number) {
    return `This action returns a #${id} historialEstadoOrden`;
  }

  update(id: number, updateHistorialEstadoOrdenDto: UpdateHistorialEstadoOrdenDto) {
    return `This action updates a #${id} historialEstadoOrden`;
  }

  remove(id: number) {
    return `This action removes a #${id} historialEstadoOrden`;
  }
}
