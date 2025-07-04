import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from './entities/categoria.entity';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';

@Injectable()
export class CategoriaService {
  constructor(
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
  ) { }

  async create(createDto: CreateCategoriaDto): Promise<Categoria> {
    const existe = await this.categoriaRepository.findOne({
      where: { nombre: createDto.nombre },
      withDeleted: true,
    });

    if (existe) {
      throw new BadRequestException('Ya existe una categoría con ese nombre');
    }

    const nueva = this.categoriaRepository.create({
      nombre: createDto.nombre,
      descripcion: createDto.descripcion,
      estado: true, // Por defecto se crea como activo
    });

    return this.categoriaRepository.save(nueva);
  }

  findAll(includeInactive = false): Promise<Categoria[]> {
    return this.categoriaRepository.find({
      where: includeInactive ? {} : { estado: true },
      withDeleted: includeInactive,
    });
  }

  async findOne(id: number, includeInactive = false): Promise<Categoria> {
    const categoria = await this.categoriaRepository.findOne({
      where: { id },
      withDeleted: includeInactive,
    });

    if (!categoria || (!includeInactive && !categoria.estado)) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return categoria;
  }

  async update(id: number, updateDto: UpdateCategoriaDto): Promise<Categoria> {
    const categoria = await this.findOne(id, true);

    if (updateDto.nombre) {
      const duplicado = await this.categoriaRepository.findOne({
        where: { nombre: updateDto.nombre },
        withDeleted: true,
      });

      if (duplicado && duplicado.id !== id) {
        throw new BadRequestException('Ya existe una categoría con ese nombre');
      }
    }

    if (updateDto.nombre) {
      categoria.nombre = updateDto.nombre;
    }

    if (updateDto.descripcion !== undefined) {
      categoria.descripcion = updateDto.descripcion;
    }

    if (updateDto.estado !== undefined) {
      categoria.estado = updateDto.estado;
    }

    return this.categoriaRepository.save(categoria);
  }

  async remove(id: number): Promise<{ message: string }> {
    const categoria = await this.findOne(id);
    
    // Soft delete
    await this.categoriaRepository.softRemove(categoria);
    
    // Además marcamos como inactivo
    categoria.estado = false;
    await this.categoriaRepository.save(categoria);
    
    return { message: `Categoría con ID ${id} deshabilitada (soft delete).` };
  }

  async restore(id: number): Promise<{ message: string }> {
    const categoria = await this.findOne(id, true);

    if (!categoria.deletedAt) {
      throw new BadRequestException('La categoría no está eliminada');
    }

    // Restauramos el soft delete
    await this.categoriaRepository.restore(id);
    
    // Lo marcamos como activo
    categoria.estado = true;
    await this.categoriaRepository.save(categoria);
    
    return { message: `Categoría con ID ${id} restaurada.` };
  }

  async findAllPaginated(
    page: number,
    limit: number,
    search?: string,
    includeInactive = false,
  ): Promise<{ data: Categoria[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = this.categoriaRepository.createQueryBuilder('categoria');

    if (search) {
      query.where('LOWER(categoria.nombre) LIKE LOWER(:search)', { 
        search: `%${search}%` 
      });
    }

    if (!includeInactive) {
      query.andWhere('categoria.estado = :estado', { estado: true })
           .andWhere('categoria.deletedAt IS NULL');
    }

    query.skip(skip)
      .take(limit)
      .orderBy('categoria.nombre', 'ASC');

    const [data, total] = await query.getManyAndCount();

    return { data, total };
  }

  async toggleStatus(id: number): Promise<Categoria> {
    const categoria = await this.findOne(id, true);
    
    categoria.estado = !categoria.estado;
    await this.categoriaRepository.save(categoria);
    
    return categoria;
  }
}