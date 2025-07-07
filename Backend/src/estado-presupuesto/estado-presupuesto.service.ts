import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadoPresupuesto } from './entities/estado-presupuesto.entity';
import { CreateEstadoPresupuestoDto } from './dto/create-estado-presupuesto.dto';
import { UpdateEstadoPresupuestoDto } from './dto/update-estado-presupuesto.dto';

@Injectable()
export class EstadoPresupuestoService {
  constructor(
    @InjectRepository(EstadoPresupuesto)
    private readonly estadoPresupuestoRepository: Repository<EstadoPresupuesto>,
  ) { }

  async create(createDto: CreateEstadoPresupuestoDto): Promise<EstadoPresupuesto> {
    const existe = await this.estadoPresupuestoRepository.findOne({
      where: { nombre: createDto.nombre },
      withDeleted: true,
    });

    if (existe) {
      throw new BadRequestException('Ya existe un estado de presupuesto con ese nombre');
    }

    const nuevo = this.estadoPresupuestoRepository.create({
      nombre: createDto.nombre,
      descripcion: createDto.descripcion,
      estado: true, // Por defecto se crea como activo
    });

    return this.estadoPresupuestoRepository.save(nuevo);
  }

  findAll(includeInactive = false): Promise<EstadoPresupuesto[]> {
    return this.estadoPresupuestoRepository.find({
      where: includeInactive ? {} : { estado: true },
      withDeleted: includeInactive,
      relations: ['presupuestos'],
    });
  }

  async findOne(id: number, includeInactive = false): Promise<EstadoPresupuesto> {
    const estado = await this.estadoPresupuestoRepository.findOne({
      where: { id },
      withDeleted: includeInactive,
      relations: ['presupuestos'],
    });

    if (!estado || (!includeInactive && !estado.estado)) {
      throw new NotFoundException('Estado de presupuesto no encontrado');
    }

    return estado;
  }

  async update(id: number, updateDto: UpdateEstadoPresupuestoDto): Promise<EstadoPresupuesto> {
    const estado = await this.findOne(id, true);

    if (updateDto.nombre) {
      const duplicado = await this.estadoPresupuestoRepository.findOne({
        where: { nombre: updateDto.nombre },
        withDeleted: true,
      });

      if (duplicado && duplicado.id !== id) {
        throw new BadRequestException('Ya existe un estado de presupuesto con ese nombre');
      }
    }

    if (updateDto.nombre) {
      estado.nombre = updateDto.nombre;
    }

    if (updateDto.descripcion) {
      estado.descripcion = updateDto.descripcion;
    }

    if (updateDto.estado !== undefined) {
      estado.estado = updateDto.estado;
    }

    return this.estadoPresupuestoRepository.save(estado);
  }

  async remove(id: number): Promise<{ message: string }> {
    const estado = await this.findOne(id);
    
    // Soft delete con TypeORM
    await this.estadoPresupuestoRepository.softRemove(estado);
    
    // Además marcamos como inactivo
    estado.estado = false;
    await this.estadoPresupuestoRepository.save(estado);
    
    return { message: `Estado de presupuesto con ID ${id} deshabilitado (soft delete).` };
  }

  async restore(id: number): Promise<{ message: string }> {
    const estado = await this.findOne(id, true);

    if (!estado.deletedAt) {
      throw new BadRequestException('El estado de presupuesto no está eliminado');
    }

    // Restauramos el soft delete
    await this.estadoPresupuestoRepository.restore(id);
    
    // Lo marcamos como activo
    estado.estado = true;
    await this.estadoPresupuestoRepository.save(estado);
    
    return { message: `Estado de presupuesto con ID ${id} restaurado.` };
  }

  async findAllPaginated(
    page: number,
    limit: number,
    search?: string,
    includeInactive = false,
  ): Promise<{ data: EstadoPresupuesto[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = this.estadoPresupuestoRepository.createQueryBuilder('estado')
      .leftJoinAndSelect('estado.presupuestos', 'presupuestos');

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

  async toggleStatus(id: number): Promise<EstadoPresupuesto> {
    const estado = await this.findOne(id, true);
    
    estado.estado = !estado.estado;
    await this.estadoPresupuestoRepository.save(estado);
    
    return estado;
  }
}