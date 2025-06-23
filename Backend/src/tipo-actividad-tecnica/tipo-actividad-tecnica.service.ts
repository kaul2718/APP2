import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoActividadTecnica } from './entities/tipo-actividad-tecnica.entity';
import { CreateTipoActividadTecnicaDto } from './dto/create-tipo-actividad-tecnica.dto';
import { UpdateTipoActividadTecnicaDto } from './dto/update-tipo-actividad-tecnica.dto';

@Injectable()
export class TipoActividadTecnicaService {
  constructor(
    @InjectRepository(TipoActividadTecnica)
    private readonly tipoActividadRepository: Repository<TipoActividadTecnica>,
  ) {}

  async create(createDto: CreateTipoActividadTecnicaDto): Promise<TipoActividadTecnica> {
    const nuevoTipo = this.tipoActividadRepository.create(createDto);
    try {
      return await this.tipoActividadRepository.save(nuevoTipo);
    } catch (error) {
      throw new InternalServerErrorException('Error al crear TipoActividadTecnica');
    }
  }

  async findAll(): Promise<TipoActividadTecnica[]> {
    return this.tipoActividadRepository.find({
      where: { isDeleted: false },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number): Promise<TipoActividadTecnica> {
    const tipo = await this.tipoActividadRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!tipo) {
      throw new NotFoundException(`TipoActividadTecnica con ID ${id} no encontrada`);
    }
    return tipo;
  }

  async update(id: number, updateDto: UpdateTipoActividadTecnicaDto): Promise<TipoActividadTecnica> {
    const tipo = await this.tipoActividadRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!tipo) {
      throw new NotFoundException(`TipoActividadTecnica con ID ${id} no encontrada`);
    }

    Object.assign(tipo, updateDto);

    try {
      return await this.tipoActividadRepository.save(tipo);
    } catch (error) {
      throw new InternalServerErrorException('Error al actualizar TipoActividadTecnica');
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    const tipo = await this.tipoActividadRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!tipo) {
      throw new NotFoundException(`TipoActividadTecnica con ID ${id} no encontrada`);
    }

    tipo.isDeleted = true;
    tipo.deletedAt = new Date();

    try {
      await this.tipoActividadRepository.save(tipo);
      return { message: `TipoActividadTecnica con ID ${id} eliminada (soft delete)` };
    } catch (error) {
      throw new InternalServerErrorException('Error al eliminar TipoActividadTecnica');
    }
  }
}
