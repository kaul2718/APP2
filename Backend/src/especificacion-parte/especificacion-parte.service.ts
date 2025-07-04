import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EspecificacionParte } from './entities/especificacion-parte.entity';
import { Parte } from '../parte/entities/parte.entity';
import { TipoEspecificacion } from '../tipo-especificacion/entities/tipo-especificacion.entity';
import { CreateEspecificacionParteDto } from './dto/create-especificacion-parte.dto';
import { UpdateEspecificacionParteDto } from './dto/update-especificacion-parte.dto';

@Injectable()
export class EspecificacionParteService {
  constructor(
    @InjectRepository(EspecificacionParte)
    private readonly especificacionRepository: Repository<EspecificacionParte>,
    @InjectRepository(Parte)
    private readonly parteRepository: Repository<Parte>,
    @InjectRepository(TipoEspecificacion)
    private readonly tipoEspecificacionRepository: Repository<TipoEspecificacion>,
  ) { }

  async create(createDto: CreateEspecificacionParteDto): Promise<EspecificacionParte> {
    // Verificar si ya existe una especificación con el mismo tipo para la misma parte
    const existe = await this.especificacionRepository.findOne({
      where: { 
        parteId: createDto.parteId,
        tipoEspecificacionId: createDto.tipoEspecificacionId
      },
      withDeleted: true,
    });

    if (existe) {
      throw new BadRequestException('Ya existe una especificación de este tipo para la parte');
    }

    // Verificar que la parte exista
    const parte = await this.parteRepository.findOne({ 
      where: { id: createDto.parteId } 
    });
    if (!parte) {
      throw new NotFoundException('Parte no encontrada');
    }

    // Verificar que el tipo de especificación exista
    const tipoEspecificacion = await this.tipoEspecificacionRepository.findOne({ 
      where: { id: createDto.tipoEspecificacionId } 
    });
    if (!tipoEspecificacion) {
      throw new NotFoundException('Tipo de especificación no encontrado');
    }

    const nuevo = this.especificacionRepository.create({
      valor: createDto.valor,
      parte,
      tipoEspecificacion,
      estado: true, // Por defecto se crea como activo
    });

    return this.especificacionRepository.save(nuevo);
  }

  findAll(includeInactive = false): Promise<EspecificacionParte[]> {
    return this.especificacionRepository.find({
      where: includeInactive ? {} : { estado: true },
      withDeleted: includeInactive,
      relations: ['parte', 'tipoEspecificacion'],
    });
  }

  async findOne(id: number, includeInactive = false): Promise<EspecificacionParte> {
    const especificacion = await this.especificacionRepository.findOne({
      where: { id },
      withDeleted: includeInactive,
      relations: ['parte', 'tipoEspecificacion'],
    });

    if (!especificacion || (!includeInactive && !especificacion.estado)) {
      throw new NotFoundException('Especificación no encontrada');
    }

    return especificacion;
  }

  async update(id: number, updateDto: UpdateEspecificacionParteDto): Promise<EspecificacionParte> {
    const especificacion = await this.findOne(id, true);

    // Verificar si se está cambiando el tipo de especificación y si ya existe para la parte
    if (updateDto.tipoEspecificacionId && 
        updateDto.tipoEspecificacionId !== especificacion.tipoEspecificacionId) {
      const duplicado = await this.especificacionRepository.findOne({
        where: { 
          parteId: especificacion.parteId,
          tipoEspecificacionId: updateDto.tipoEspecificacionId
        },
        withDeleted: true,
      });

      if (duplicado && duplicado.id !== id) {
        throw new BadRequestException('Ya existe una especificación de este tipo para la parte');
      }

      const tipoEspecificacion = await this.tipoEspecificacionRepository.findOne({ 
        where: { id: updateDto.tipoEspecificacionId } 
      });
      if (!tipoEspecificacion) {
        throw new NotFoundException('Nuevo tipo de especificación no encontrado');
      }
      especificacion.tipoEspecificacion = tipoEspecificacion;
    }

    if (updateDto.valor !== undefined) {
      especificacion.valor = updateDto.valor;
    }

    if (updateDto.estado !== undefined) {
      especificacion.estado = updateDto.estado;
    }

    return this.especificacionRepository.save(especificacion);
  }

  async remove(id: number): Promise<{ message: string }> {
    const especificacion = await this.findOne(id);
    
    // Soft delete con TypeORM
    await this.especificacionRepository.softRemove(especificacion);
    
    // Además marcamos como inactivo
    especificacion.estado = false;
    await this.especificacionRepository.save(especificacion);
    
    return { message: `Especificación con ID ${id} deshabilitada (soft delete).` };
  }

  async restore(id: number): Promise<{ message: string }> {
    const especificacion = await this.findOne(id, true);

    if (!especificacion.deletedAt) {
      throw new BadRequestException('La especificación no está eliminada');
    }

    // Restauramos el soft delete
    await this.especificacionRepository.restore(id);
    
    // Lo marcamos como activo
    especificacion.estado = true;
    await this.especificacionRepository.save(especificacion);
    
    return { message: `Especificación con ID ${id} restaurada.` };
  }

  async findAllPaginated(
    page: number,
    limit: number,
    search?: string,
    includeInactive = false,
  ): Promise<{ data: EspecificacionParte[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = this.especificacionRepository.createQueryBuilder('especificacion')
      .leftJoinAndSelect('especificacion.parte', 'parte')
      .leftJoinAndSelect('especificacion.tipoEspecificacion', 'tipoEspecificacion');

    if (search) {
      query.where('LOWER(especificacion.valor) LIKE LOWER(:search)', { 
        search: `%${search}%` 
      });
    }

    if (!includeInactive) {
      query.andWhere('especificacion.estado = :estado', { estado: true })
           .andWhere('especificacion.deletedAt IS NULL');
    }

    query.skip(skip)
      .take(limit)
      .orderBy('especificacion.valor', 'ASC');

    const [data, total] = await query.getManyAndCount();

    return { data, total };
  }

  async toggleStatus(id: number): Promise<EspecificacionParte> {
    const especificacion = await this.findOne(id, true);
    
    especificacion.estado = !especificacion.estado;
    await this.especificacionRepository.save(especificacion);
    
    return especificacion;
  }

  async findByParte(parteId: number, includeInactive = false): Promise<EspecificacionParte[]> {
    const parte = await this.parteRepository.findOne({ where: { id: parteId } });
    if (!parte) {
      throw new NotFoundException('Parte no encontrada');
    }

    return this.especificacionRepository.find({
      where: {
        parteId,
        ...(includeInactive ? {} : { estado: true })
      },
      withDeleted: includeInactive,
      relations: ['tipoEspecificacion'],
    });
  }

  async findByTipoEspecificacion(tipoId: number, includeInactive = false): Promise<EspecificacionParte[]> {
    const tipo = await this.tipoEspecificacionRepository.findOne({ where: { id: tipoId } });
    if (!tipo) {
      throw new NotFoundException('Tipo de especificación no encontrado');
    }

    return this.especificacionRepository.find({
      where: {
        tipoEspecificacionId: tipoId,
        ...(includeInactive ? {} : { estado: true })
      },
      withDeleted: includeInactive,
      relations: ['parte'],
    });
  }
}