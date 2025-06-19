import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoEspecificacion } from './entities/tipo-especificacion.entity';
import { CreateTipoEspecificacionDto } from './dto/create-tipo-especificacion.dto';
import { UpdateTipoEspecificacionDto } from './dto/update-tipo-especificacion.dto';

@Injectable()
export class TipoEspecificacionService {
  constructor(
    @InjectRepository(TipoEspecificacion)
    private readonly repo: Repository<TipoEspecificacion>
  ) {}

  async create(dto: CreateTipoEspecificacionDto) {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async findAll() {
    return this.repo.find({ where: { deletedAt: null } });
  }

  async findOne(id: number) {
    const entity = await this.repo.findOne({ where: { id, deletedAt: null } });
    if (!entity) {
      throw new NotFoundException(`No se encontró el tipo de especificación con ID ${id}`);
    }
    return entity;
  }

  async update(id: number, dto: UpdateTipoEspecificacionDto) {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.repo.save(entity);
  }

  async remove(id: number) {
    const entity = await this.findOne(id);
    entity.deletedAt = new Date();
    return this.repo.save(entity); // Soft delete manual
  }
}
