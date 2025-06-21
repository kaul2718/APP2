import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadoPresupuesto } from './entities/estado-presupuesto.entity';
import { CreateEstadoPresupuestoDto } from './dto/create-estado-presupuesto.dto';
import { UpdateEstadoPresupuestoDto } from './dto/update-estado-presupuesto.dto';

@Injectable()
export class EstadoPresupuestoService {
  constructor(
    @InjectRepository(EstadoPresupuesto)
    private estadoRepo: Repository<EstadoPresupuesto>,
  ) {}

  async create(dto: CreateEstadoPresupuestoDto): Promise<EstadoPresupuesto> {
    const estado = this.estadoRepo.create(dto);
    return await this.estadoRepo.save(estado);
  }

  async findAll(): Promise<EstadoPresupuesto[]> {
    return await this.estadoRepo.find();
  }

  async findOne(id: number): Promise<EstadoPresupuesto> {
    const estado = await this.estadoRepo.findOneBy({ id });
    if (!estado) throw new NotFoundException(`EstadoPresupuesto con ID ${id} no encontrado`);
    return estado;
  }

  async update(id: number, dto: UpdateEstadoPresupuestoDto): Promise<EstadoPresupuesto> {
    const estado = await this.findOne(id);
    Object.assign(estado, dto);
    return await this.estadoRepo.save(estado);
  }

  async remove(id: number): Promise<{ message: string }> {
    const estado = await this.findOne(id);
    await this.estadoRepo.remove(estado);
    return { message: 'Estado eliminado correctamente' };
  }
}
