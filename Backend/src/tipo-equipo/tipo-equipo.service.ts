import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoEquipo } from './entities/tipo-equipo.entity';
import { CreateTipoEquipoDto } from './dto/create-tipo-equipo.dto';
import { UpdateTipoEquipoDto } from './dto/update-tipo-equipo.dto';

@Injectable()
export class TipoEquipoService {
  constructor(
    @InjectRepository(TipoEquipo)
    private readonly tipoEquipoRepository: Repository<TipoEquipo>,
  ) {}

  async create(createDto: CreateTipoEquipoDto): Promise<TipoEquipo> {
    const existe = await this.tipoEquipoRepository.findOne({ where: { nombre: createDto.nombre } });
    if (existe) {
      throw new BadRequestException('Ya existe un tipo de equipo con ese nombre.');
    }
    const nuevo = this.tipoEquipoRepository.create(createDto);
    return this.tipoEquipoRepository.save(nuevo);
  }

  findAll(): Promise<TipoEquipo[]> {
    return this.tipoEquipoRepository.find();
  }

  async findOne(id: number): Promise<TipoEquipo> {
    const tipo = await this.tipoEquipoRepository.findOne({ where: { id } });
    if (!tipo) {
      throw new NotFoundException('Tipo de equipo no encontrado.');
    }
    return tipo;
  }

  async update(id: number, updateDto: UpdateTipoEquipoDto): Promise<TipoEquipo> {
    const tipo = await this.findOne(id);
    Object.assign(tipo, updateDto);
    return this.tipoEquipoRepository.save(tipo);
  }

  async remove(id: number): Promise<void> {
    const tipo = await this.findOne(id);
    await this.tipoEquipoRepository.remove(tipo);
  }
}
