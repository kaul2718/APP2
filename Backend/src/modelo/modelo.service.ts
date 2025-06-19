import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Modelo } from './entities/modelo.entity';
import { Marca } from '../marca/entities/marca.entity';
import { CreateModeloDto } from './dto/create-modelo.dto';
import { UpdateModeloDto } from './dto/update-modelo.dto';

@Injectable()
export class ModeloService {
  constructor(
    @InjectRepository(Modelo)
    private readonly modeloRepository: Repository<Modelo>,
    @InjectRepository(Marca)
    private readonly marcaRepository: Repository<Marca>,
  ) { }

  async create(createModeloDto: CreateModeloDto): Promise<Modelo> {
    const { nombre, marcaId } = createModeloDto;

    const exists = await this.modeloRepository.findOne({
      where: { nombre, isDeleted: false },
    });
    if (exists) {
      throw new BadRequestException('Ya existe un modelo con ese nombre');
    }

    const marca = await this.marcaRepository.findOne({ where: { id: marcaId } });
    if (!marca) {
      throw new NotFoundException('Marca no encontrada');
    }

    const modelo = this.modeloRepository.create({
      nombre,
      marca,
    });

    return this.modeloRepository.save(modelo);
  }

  async findAll(): Promise<Modelo[]> {
    return this.modeloRepository.find({
      where: { isDeleted: false },
      relations: ['marca'],
    });
  }

  async findOne(id: number): Promise<Modelo> {
    const modelo = await this.modeloRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['marca'],
    });
    if (!modelo) {
      throw new NotFoundException('Modelo no encontrado');
    }
    return modelo;
  }

  async update(id: number, updateModeloDto: UpdateModeloDto): Promise<Modelo> {
    const modelo = await this.findOne(id);

    // Actualiza el nombre si viene en el DTO
    if (updateModeloDto.nombre) {
      modelo.nombre = updateModeloDto.nombre;
    }

    // Actualiza la marca si viene en el DTO
    if (updateModeloDto.marcaId) {
      const nuevaMarca = await this.marcaRepository.findOne({ where: { id: updateModeloDto.marcaId } });
      if (!nuevaMarca) {
        throw new NotFoundException('Marca no encontrada');
      }
      modelo.marca = nuevaMarca;
    }

    return this.modeloRepository.save(modelo);
  }

  async remove(id: number): Promise<{ message: string }> {
    const modelo = await this.modeloRepository.findOne({ where: { id } });

    if (!modelo || modelo.isDeleted) {
      throw new BadRequestException('Este modelo ya está eliminado o no existe');
    }

    modelo.isDeleted = true;
    await this.modeloRepository.save(modelo);

    return { message: `Modelo con ID ${id} eliminado correctamente` };
  }
}
