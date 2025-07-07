import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { TipoNotificacion } from './entities/tipo-notificacion.entity';
import { Notificacion } from '../notificacion/entities/notificacion.entity';
import { CreateTipoNotificacionDto } from './dto/create-tipo-notificacion.dto';
import { UpdateTipoNotificacionDto } from './dto/update-tipo-notificacion.dto';

@Injectable()
export class TipoNotificacionService {
  constructor(
    @InjectRepository(TipoNotificacion)
    private readonly tipoNotificacionRepository: Repository<TipoNotificacion>,
    @InjectRepository(Notificacion)
    private readonly notificacionRepository: Repository<Notificacion>,
  ) { }

  async create(createDto: CreateTipoNotificacionDto): Promise<TipoNotificacion> {
    const existe = await this.tipoNotificacionRepository.findOne({
      where: { nombre: createDto.nombre },
      withDeleted: true,
    });

    if (existe) {
      throw new BadRequestException('Ya existe un tipo de notificación con ese nombre');
    }

    const nuevo = this.tipoNotificacionRepository.create({
      nombre: createDto.nombre,
      descripcion: createDto.descripcion,
      estado: true, // Por defecto se crea como activo
    });

    return this.tipoNotificacionRepository.save(nuevo);
  }

  findAll(includeInactive = false): Promise<TipoNotificacion[]> {
    return this.tipoNotificacionRepository.find({
      where: includeInactive ? {} : { estado: true },
      withDeleted: includeInactive,
      relations: ['notificaciones'],
    });
  }

  async findOne(id: number, includeInactive = false): Promise<TipoNotificacion> {
    const tipo = await this.tipoNotificacionRepository.findOne({
      where: { id },
      withDeleted: includeInactive,
      relations: ['notificaciones'],
    });

    if (!tipo || (!includeInactive && !tipo.estado)) {
      throw new NotFoundException('Tipo de notificación no encontrado');
    }

    return tipo;
  }

  async update(id: number, updateDto: UpdateTipoNotificacionDto): Promise<TipoNotificacion> {
    const tipo = await this.findOne(id, true);

    if (updateDto.nombre) {
      const duplicado = await this.tipoNotificacionRepository.findOne({
        where: { nombre: updateDto.nombre },
        withDeleted: true,
      });

      if (duplicado && duplicado.id !== id) {
        throw new BadRequestException('Ya existe un tipo de notificación con ese nombre');
      }
    }

    if (updateDto.nombre) {
      tipo.nombre = updateDto.nombre;
    }

    if (updateDto.descripcion !== undefined) {
      tipo.descripcion = updateDto.descripcion;
    }

    if (updateDto.estado !== undefined) {
      tipo.estado = updateDto.estado;
    }

    return this.tipoNotificacionRepository.save(tipo);
  }

  async remove(id: number): Promise<{ message: string }> {
    const tipo = await this.findOne(id);
    
    // Verificar si hay notificaciones asociadas
    const notificaciones = await this.notificacionRepository.count({ 
      where: { tipo: { id } } 
    });
    
    if (notificaciones > 0) {
      throw new BadRequestException('No se puede eliminar, hay notificaciones asociadas a este tipo');
    }
    
    // Soft delete con TypeORM
    await this.tipoNotificacionRepository.softRemove(tipo);
    
    // Además marcamos como inactivo
    tipo.estado = false;
    await this.tipoNotificacionRepository.save(tipo);
    
    return { message: `Tipo de notificación con ID ${id} deshabilitado (soft delete).` };
  }

  async restore(id: number): Promise<{ message: string }> {
    const tipo = await this.findOne(id, true);

    if (!tipo.deletedAt) {
      throw new BadRequestException('El tipo de notificación no está eliminado');
    }

    // Restauramos el soft delete
    await this.tipoNotificacionRepository.restore(id);
    
    // Lo marcamos como activo
    tipo.estado = true;
    await this.tipoNotificacionRepository.save(tipo);
    
    return { message: `Tipo de notificación con ID ${id} restaurado.` };
  }

  async findAllPaginated(
    page: number,
    limit: number,
    search?: string,
    includeInactive = false,
  ): Promise<{ data: TipoNotificacion[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = this.tipoNotificacionRepository.createQueryBuilder('tipo')
      .leftJoinAndSelect('tipo.notificaciones', 'notificaciones');

    if (search) {
      query.where('LOWER(tipo.nombre) LIKE LOWER(:search)', { 
        search: `%${search}%` 
      });
    }

    if (!includeInactive) {
      query.andWhere('tipo.estado = :estado', { estado: true })
           .andWhere('tipo.deletedAt IS NULL');
    }

    query.skip(skip)
      .take(limit)
      .orderBy('tipo.nombre', 'ASC');

    const [data, total] = await query.getManyAndCount();

    return { data, total };
  }

  async toggleStatus(id: number): Promise<TipoNotificacion> {
    const tipo = await this.findOne(id, true);
    
    tipo.estado = !tipo.estado;
    await this.tipoNotificacionRepository.save(tipo);
    
    return tipo;
  }
}