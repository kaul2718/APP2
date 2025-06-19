import { Injectable } from '@nestjs/common';
import { CreateEstadoPresupuestoDto } from './dto/create-estado-presupuesto.dto';
import { UpdateEstadoPresupuestoDto } from './dto/update-estado-presupuesto.dto';

@Injectable()
export class EstadoPresupuestoService {
  create(createEstadoPresupuestoDto: CreateEstadoPresupuestoDto) {
    return 'This action adds a new estadoPresupuesto';
  }

  findAll() {
    return `This action returns all estadoPresupuesto`;
  }

  findOne(id: number) {
    return `This action returns a #${id} estadoPresupuesto`;
  }

  update(id: number, updateEstadoPresupuestoDto: UpdateEstadoPresupuestoDto) {
    return `This action updates a #${id} estadoPresupuesto`;
  }

  remove(id: number) {
    return `This action removes a #${id} estadoPresupuesto`;
  }
}
