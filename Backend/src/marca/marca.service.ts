import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Marca } from './entities/marca.entity';
import { CreateMarcaDto } from './dto/create-marca.dto';
import { UpdateMarcaDto } from './dto/update-marca.dto';

@Injectable()
export class MarcaService {
  constructor(
    @InjectRepository(Marca)
    private readonly marcaRepository: Repository<Marca>,
  ) {}

  async create(createMarcaDto: CreateMarcaDto): Promise<Marca> {
    const existing = await this.marcaRepository.findOne({ where: { nombre: createMarcaDto.nombre } });
    if (existing) {
      throw new BadRequestException('Ya existe una marca con ese nombre.');
    }

    const marca = this.marcaRepository.create(createMarcaDto);
    return this.marcaRepository.save(marca);
  }

  findAll(): Promise<Marca[]> {
    return this.marcaRepository.find({ relations: ['modelos'] });
  }

  async findOne(id: number): Promise<Marca> {
    const marca = await this.marcaRepository.findOne({ where: { id }, relations: ['modelos'] });
    if (!marca) throw new NotFoundException('Marca no encontrada.');
    return marca;
  }

  async update(id: number, updateMarcaDto: UpdateMarcaDto): Promise<Marca> {
    const marca = await this.findOne(id);

    if (updateMarcaDto.nombre) {
      const duplicate = await this.marcaRepository.findOne({ where: { nombre: updateMarcaDto.nombre } });
      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException('Ya existe una marca con ese nombre.');
      }
    }

    Object.assign(marca, updateMarcaDto);
    return this.marcaRepository.save(marca);
  }

  async remove(id: number): Promise<{ message: string }> {
    const marca = await this.findOne(id);
    await this.marcaRepository.remove(marca);
    return { message: `Marca con ID ${id} eliminada.` };
  }
}
