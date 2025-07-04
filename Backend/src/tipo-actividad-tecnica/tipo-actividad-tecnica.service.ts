import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { TipoActividadTecnica } from './entities/tipo-actividad-tecnica.entity';
import { CreateTipoActividadTecnicaDto } from './dto/create-tipo-actividad-tecnica.dto';
import { UpdateTipoActividadTecnicaDto } from './dto/update-tipo-actividad-tecnica.dto';
import { ActividadTecnica } from '../actividad-tecnica/entities/actividad-tecnica.entity';

@Injectable()
export class TipoActividadTecnicaService {
  constructor(
    @InjectRepository(TipoActividadTecnica)
    private readonly tipoActividadRepository: Repository<TipoActividadTecnica>,
    @InjectRepository(ActividadTecnica)
    private readonly actividadRepository: Repository<ActividadTecnica>,
  ) { }

  async create(createDto: CreateTipoActividadTecnicaDto): Promise<TipoActividadTecnica> {
    const existe = await this.tipoActividadRepository.findOne({
      where: { nombre: createDto.nombre },
      withDeleted: true,
    });

    if (existe) {
      throw new BadRequestException('Ya existe un tipo de actividad técnica con ese nombre');
    }

    const nuevo = this.tipoActividadRepository.create({
      nombre: createDto.nombre,
      descripcion: createDto.descripcion,
      estado: true, // Por defecto se crea como activo
    });

    return this.tipoActividadRepository.save(nuevo);
  }

  findAll(includeInactive = false): Promise<TipoActividadTecnica[]> {
    return this.tipoActividadRepository.find({
      where: includeInactive ? {} : { estado: true },
      withDeleted: includeInactive,
      relations: ['actividades'],
    });
  }

  async findOne(id: number, includeInactive = false): Promise<TipoActividadTecnica> {
    const tipoActividad = await this.tipoActividadRepository.findOne({
      where: { id },
      withDeleted: includeInactive,
      relations: ['actividades'],
    });

    if (!tipoActividad || (!includeInactive && !tipoActividad.estado)) {
      throw new NotFoundException('Tipo de actividad técnica no encontrado');
    }

    return tipoActividad;
  }

  async update(id: number, updateDto: UpdateTipoActividadTecnicaDto): Promise<TipoActividadTecnica> {
    const tipoActividad = await this.findOne(id, true);

    if (updateDto.nombre) {
      const duplicado = await this.tipoActividadRepository.findOne({
        where: { nombre: updateDto.nombre },
        withDeleted: true,
      });

      if (duplicado && duplicado.id !== id) {
        throw new BadRequestException('Ya existe un tipo de actividad técnica con ese nombre');
      }
    }

    if (updateDto.nombre) {
      tipoActividad.nombre = updateDto.nombre;
    }

    if (updateDto.descripcion !== undefined) {
      tipoActividad.descripcion = updateDto.descripcion;
    }

    if (updateDto.estado !== undefined) {
      tipoActividad.estado = updateDto.estado;
    }

    return this.tipoActividadRepository.save(tipoActividad);
  }

  async remove(id: number): Promise<{ message: string }> {
    const tipoActividad = await this.findOne(id);
    
    // Verificar si hay actividades asociadas
    const actividades = await this.actividadRepository.find({
      where: { tipoActividad: { id } }
    });

    if (actividades.length > 0) {
      throw new BadRequestException('No se puede eliminar porque hay actividades técnicas asociadas');
    }

    // Soft delete con TypeORM
    await this.tipoActividadRepository.softRemove(tipoActividad);
    
    // Además marcamos como inactivo
    tipoActividad.estado = false;
    await this.tipoActividadRepository.save(tipoActividad);
    
    return { message: `Tipo de actividad técnica con ID ${id} deshabilitado (soft delete).` };
  }

  async restore(id: number): Promise<{ message: string }> {
    const tipoActividad = await this.findOne(id, true);

    if (!tipoActividad.deletedAt) {
      throw new BadRequestException('El tipo de actividad técnica no está eliminado');
    }

    // Restauramos el soft delete
    await this.tipoActividadRepository.restore(id);
    
    // Lo marcamos como activo
    tipoActividad.estado = true;
    await this.tipoActividadRepository.save(tipoActividad);
    
    return { message: `Tipo de actividad técnica con ID ${id} restaurado.` };
  }

  async findAllPaginated(
    page: number,
    limit: number,
    search?: string,
    includeInactive = false,
  ): Promise<{ data: TipoActividadTecnica[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = this.tipoActividadRepository.createQueryBuilder('tipoActividad')
      .leftJoinAndSelect('tipoActividad.actividades', 'actividades');

    if (search) {
      query.where('LOWER(tipoActividad.nombre) LIKE LOWER(:search)', { 
        search: `%${search}%` 
      });
    }

    if (!includeInactive) {
      query.andWhere('tipoActividad.estado = :estado', { estado: true })
           .andWhere('tipoActividad.deletedAt IS NULL');
    }

    query.skip(skip)
      .take(limit)
      .orderBy('tipoActividad.nombre', 'ASC');

    const [data, total] = await query.getManyAndCount();

    return { data, total };
  }

  async toggleStatus(id: number): Promise<TipoActividadTecnica> {
    const tipoActividad = await this.findOne(id, true);
    
    tipoActividad.estado = !tipoActividad.estado;
    await this.tipoActividadRepository.save(tipoActividad);
    
    return tipoActividad;
  }
}