import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadoOrden } from './entities/estado-orden.entity';
import { CreateEstadoOrdenDto } from './dto/create-estado-orden.dto';
import { UpdateEstadoOrdenDto } from './dto/update-estado-orden.dto';

@Injectable()
export class EstadoOrdenService {
  constructor(
    @InjectRepository(EstadoOrden)
    private readonly estadoOrdenRepository: Repository<EstadoOrden>,
  ) {}

  async create(createDto: CreateEstadoOrdenDto): Promise<EstadoOrden> {
    const existe = await this.estadoOrdenRepository.findOne({
      where: { nombre: createDto.nombre },
      withDeleted: true,
    });

    if (existe) {
      throw new BadRequestException('Ya existe un estado de orden con ese nombre');
    }

    const nuevo = this.estadoOrdenRepository.create({
      nombre: createDto.nombre,
      descripcion: createDto.descripcion,
      estado: true,
    });

    return this.estadoOrdenRepository.save(nuevo);
  }

  async findAll(includeInactive = false): Promise<EstadoOrden[]> {
    return this.estadoOrdenRepository.find({
      where: includeInactive ? {} : { estado: true },
      withDeleted: includeInactive,
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number, includeInactive = false): Promise<EstadoOrden> {
    const estado = await this.estadoOrdenRepository.findOne({
      where: { id },
      withDeleted: includeInactive,
      relations: ['estadoOrdenes', 'historialEstados'], // Actualizado
    });

    if (!estado || (!includeInactive && !estado.estado)) {
      throw new NotFoundException('Estado de orden no encontrado');
    }

    return estado;
  }

  async update(id: number, updateDto: UpdateEstadoOrdenDto): Promise<EstadoOrden> {
    const estado = await this.findOne(id, true);

    if (updateDto.nombre) {
      const duplicado = await this.estadoOrdenRepository.findOne({
        where: { nombre: updateDto.nombre },
        withDeleted: true,
      });

      if (duplicado && duplicado.id !== id) {
        throw new BadRequestException('Ya existe un estado de orden con ese nombre');
      }
      estado.nombre = updateDto.nombre;
    }

    if (updateDto.descripcion !== undefined) {
      estado.descripcion = updateDto.descripcion;
    }

    if (updateDto.estado !== undefined) {
      estado.estado = updateDto.estado;
    }

    return this.estadoOrdenRepository.save(estado);
  }

  async remove(id: number): Promise<{ message: string }> {
    const estado = await this.findOne(id);
    
    if (estado.estadoOrdenes && estado.estadoOrdenes.length > 0) {
      throw new BadRequestException('No se puede eliminar un estado que tiene órdenes asociadas');
    }

    await this.estadoOrdenRepository.softRemove(estado);
    estado.estado = false;
    await this.estadoOrdenRepository.save(estado);
    
    return { message: `Estado de orden con ID ${id} deshabilitado (soft delete).` };
  }

  async restore(id: number): Promise<{ message: string }> {
    const estado = await this.findOne(id, true);

    if (!estado.deletedAt) {
      throw new BadRequestException('El estado de orden no está eliminado');
    }

    await this.estadoOrdenRepository.restore(id);
    estado.estado = true;
    await this.estadoOrdenRepository.save(estado);
    
    return { message: `Estado de orden con ID ${id} restaurado.` };
  }

  async findAllPaginated(
    page: number,
    limit: number,
    search?: string,
    includeInactive = false,
  ): Promise<{ data: EstadoOrden[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = this.estadoOrdenRepository.createQueryBuilder('estado');

    if (search) {
      query.where('LOWER(estado.nombre) LIKE LOWER(:search)', { 
        search: `%${search}%` 
      });
    }

    if (!includeInactive) {
      query.andWhere('estado.estado = :estado', { estado: true })
           .andWhere('estado.deletedAt IS NULL');
    }

    query.skip(skip)
      .take(limit)
      .orderBy('estado.nombre', 'ASC');

    const [data, total] = await query.getManyAndCount();

    return { data, total };
  }

  async toggleStatus(id: number): Promise<EstadoOrden> {
    const estado = await this.findOne(id, true);
    
    if (estado.estado && estado.estadoOrdenes && estado.estadoOrdenes.length > 0) {
      throw new BadRequestException('No se puede desactivar un estado que tiene órdenes asociadas');
    }
    
    estado.estado = !estado.estado;
    await this.estadoOrdenRepository.save(estado);
    
    return estado;
  }

  async findByName(nombre: string): Promise<EstadoOrden> {
    const estado = await this.estadoOrdenRepository.findOne({
      where: { nombre },
    });

    if (!estado) {
      throw new NotFoundException(`Estado de orden con nombre ${nombre} no encontrado`);
    }

    return estado;
  }
}