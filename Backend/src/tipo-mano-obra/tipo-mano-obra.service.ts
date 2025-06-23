import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoManoObra } from './entities/tipo-mano-obra.entity';
import { CreateTipoManoObraDto } from './dto/create-tipo-mano-obra.dto';
import { UpdateTipoManoObraDto } from './dto/update-tipo-mano-obra.dto';

@Injectable()
export class TipoManoObraService {
  constructor(
    @InjectRepository(TipoManoObra)
    private readonly tipoRepository: Repository<TipoManoObra>,
  ) {}

  async create(dto: CreateTipoManoObraDto): Promise<TipoManoObra> {
    const tipo = this.tipoRepository.create(dto);
    return await this.tipoRepository.save(tipo);
  }

  async findAll(): Promise<TipoManoObra[]> {
    // Por defecto excluye soft deleted
    return this.tipoRepository.find();
  }

  async findOne(id: number): Promise<TipoManoObra> {
    const tipo = await this.tipoRepository.findOne({ where: { id } });
    if (!tipo) throw new NotFoundException(`TipoManoObra con ID ${id} no encontrado`);
    return tipo;
  }

  async update(id: number, dto: UpdateTipoManoObraDto): Promise<TipoManoObra> {
    const tipo = await this.findOne(id);
    Object.assign(tipo, dto);
    return await this.tipoRepository.save(tipo);
  }

  async remove(id: number): Promise<{ message: string }> {
    const tipo = await this.findOne(id);
    // Soft delete
    await this.tipoRepository.softRemove(tipo);
    return { message: `TipoManoObra con ID ${id} eliminado (soft delete).` };
  }

  // Opcional: restaurar soft deleted
  async restore(id: number): Promise<TipoManoObra> {
    await this.tipoRepository.restore(id);
    const tipoRestaurado = await this.findOne(id);
    return tipoRestaurado;
  }
}
