import * as fs from 'fs';
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Marca } from './entities/marca.entity';
import { CreateMarcaDto } from './dto/create-marca.dto';
import { UpdateMarcaDto } from './dto/update-marca.dto';

@Injectable()
export class MarcaService {
  constructor(
    @InjectRepository(Marca)
    private readonly marcaRepository: Repository<Marca>,
  ) { }

  async create(createDto: CreateMarcaDto): Promise<Marca> {
    const existe = await this.marcaRepository.findOne({
      where: { nombre: createDto.nombre },
      withDeleted: true,
    });

    if (existe) {
      throw new BadRequestException('Ya existe una marca con ese nombre.');
    }

    const nuevo = this.marcaRepository.create(createDto);
    return this.marcaRepository.save(nuevo);
  }

  findAll(includeDeleted = false): Promise<Marca[]> {
    return this.marcaRepository.find({
      where: includeDeleted ? {} : { estado: true },
      withDeleted: includeDeleted,
      relations: ['modelos'],
    });
  }

  async findOne(id: number, includeDeleted = false): Promise<Marca> {
    const marca = await this.marcaRepository.findOne({
      where: { id },
      withDeleted: includeDeleted,
      relations: ['modelos'],
    });

    if (!marca) {
      throw new NotFoundException('Marca no encontrada.');
    }

    return marca;
  }

  async update(id: number, updateDto: UpdateMarcaDto): Promise<Marca> {
    const marca = await this.findOne(id, true);

    if (updateDto.nombre) {
      const duplicado = await this.marcaRepository.findOne({
        where: { nombre: updateDto.nombre },
        withDeleted: true,
      });

      if (duplicado && duplicado.id !== id) {
        throw new BadRequestException('Ya existe una marca con ese nombre.');
      }
    }

    Object.assign(marca, updateDto);
    return this.marcaRepository.save(marca);
  }

  async remove(id: number): Promise<{ message: string }> {
    const marca = await this.findOne(id);
    marca.estado = false;
    await this.marcaRepository.softRemove(marca);
    return { message: `Marca con ID ${id} deshabilitada (soft delete).` };
  }

  async restore(id: number): Promise<{ message: string }> {
    const marca = await this.findOne(id, true);

    if (!marca.deletedAt) {
      throw new BadRequestException('La marca no está eliminada.');
    }

    await this.marcaRepository.restore(id);
    marca.estado = true;
    await this.marcaRepository.save(marca);
    return { message: `Marca con ID ${id} restaurada.` };
  }

  async findAllPaginated(
    page: any,
    limit: any,
    search?: string,
    includeInactive = false,
  ): Promise<{ data: Marca[]; total: number }> {
    const whereCondition: any = {};
    
    if (!includeInactive) {
      whereCondition.estado = true;
    }

    if (search) {
      whereCondition.nombre = Like(`%${search}%`);
    }

    const limitNum = Number(limit) || 10;
    const pageNum = Number(page) || 1;
    const skip = (pageNum - 1) * limitNum;

    try {
      fs.appendFileSync('debug.txt', `[${new Date().toISOString()}] SERVICE: skip=${skip}, take=${limitNum}, totalItemsRequested=${limitNum}\n`);
    } catch (e) {
      console.error('Error writing to debug.txt', e);
    }

    const [data, total] = await this.marcaRepository.findAndCount({
      where: whereCondition,
      order: { nombre: 'ASC' },
      skip: skip,
      take: limitNum,
    });

    return { data, total };
  }

  async actualizarEstado(id: number, estado: boolean): Promise<Marca> {
    const marca = await this.marcaRepository.findOneBy({ id });
    if (!marca) throw new NotFoundException('Marca no encontrada');

    marca.estado = estado;
    await this.marcaRepository.save(marca);

    return marca;
  }
}