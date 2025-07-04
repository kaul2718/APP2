import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
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

  async create(createDto: CreateModeloDto): Promise<Modelo> {
    const existe = await this.modeloRepository.findOne({
      where: { nombre: createDto.nombre },
      withDeleted: true,
    });

    if (existe) {
      throw new BadRequestException('Ya existe un modelo con ese nombre');
    }

    const marca = await this.marcaRepository.findOne({ 
      where: { id: createDto.marcaId } 
    });
    if (!marca) {
      throw new NotFoundException('Marca no encontrada');
    }

    const nuevo = this.modeloRepository.create({
      nombre: createDto.nombre,
      marca,
      estado: true, // Por defecto se crea como activo
    });

    return this.modeloRepository.save(nuevo);
  }

  findAll(includeInactive = false): Promise<Modelo[]> {
    return this.modeloRepository.find({
      where: includeInactive ? {} : { estado: true },
      withDeleted: includeInactive,
      relations: ['marca', 'equipos'],
    });
  }

  async findOne(id: number, includeInactive = false): Promise<Modelo> {
    const modelo = await this.modeloRepository.findOne({
      where: { id },
      withDeleted: includeInactive,
      relations: ['marca', 'equipos'],
    });

    if (!modelo || (!includeInactive && !modelo.estado)) {
      throw new NotFoundException('Modelo no encontrado');
    }

    return modelo;
  }

  async update(id: number, updateDto: UpdateModeloDto): Promise<Modelo> {
    const modelo = await this.findOne(id, true);

    if (updateDto.nombre) {
      const duplicado = await this.modeloRepository.findOne({
        where: { nombre: updateDto.nombre },
        withDeleted: true,
      });

      if (duplicado && duplicado.id !== id) {
        throw new BadRequestException('Ya existe un modelo con ese nombre');
      }
    }

    if (updateDto.marcaId) {
      const marca = await this.marcaRepository.findOne({ 
        where: { id: updateDto.marcaId } 
      });
      if (!marca) {
        throw new NotFoundException('Marca no encontrada');
      }
      modelo.marca = marca;
    }

    if (updateDto.nombre) {
      modelo.nombre = updateDto.nombre;
    }

    if (updateDto.estado !== undefined) {
      modelo.estado = updateDto.estado;
    }

    return this.modeloRepository.save(modelo);
  }

  async remove(id: number): Promise<{ message: string }> {
    const modelo = await this.findOne(id);
    
    // Soft delete con TypeORM
    await this.modeloRepository.softRemove(modelo);
    
    // Además marcamos como inactivo
    modelo.estado = false;
    await this.modeloRepository.save(modelo);
    
    return { message: `Modelo con ID ${id} deshabilitado (soft delete).` };
  }

  async restore(id: number): Promise<{ message: string }> {
    const modelo = await this.findOne(id, true);

    if (!modelo.deletedAt) {
      throw new BadRequestException('El modelo no está eliminado');
    }

    // Restauramos el soft delete
    await this.modeloRepository.restore(id);
    
    // Lo marcamos como activo
    modelo.estado = true;
    await this.modeloRepository.save(modelo);
    
    return { message: `Modelo con ID ${id} restaurado.` };
  }

  async findAllPaginated(
    page: number,
    limit: number,
    search?: string,
    includeInactive = false,
  ): Promise<{ data: Modelo[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = this.modeloRepository.createQueryBuilder('modelo')
      .leftJoinAndSelect('modelo.marca', 'marca')
      .leftJoinAndSelect('modelo.equipos', 'equipos');

    if (search) {
      query.where('LOWER(modelo.nombre) LIKE LOWER(:search)', { 
        search: `%${search}%` 
      });
    }

    if (!includeInactive) {
      query.andWhere('modelo.estado = :estado', { estado: true })
           .andWhere('modelo.deletedAt IS NULL');
    }

    query.skip(skip)
      .take(limit)
      .orderBy('modelo.nombre', 'ASC');

    const [data, total] = await query.getManyAndCount();

    return { data, total };
  }

  async toggleStatus(id: number): Promise<Modelo> {
    const modelo = await this.findOne(id, true);
    
    modelo.estado = !modelo.estado;
    await this.modeloRepository.save(modelo);
    
    return modelo;
  }
}