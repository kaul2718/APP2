import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { TipoEspecificacion } from './entities/tipo-especificacion.entity';
import { CreateTipoEspecificacionDto } from './dto/create-tipo-especificacion.dto';
import { UpdateTipoEspecificacionDto } from './dto/update-tipo-especificacion.dto';

@Injectable()
export class TipoEspecificacionService {
  constructor(
    @InjectRepository(TipoEspecificacion)
    private readonly repo: Repository<TipoEspecificacion>,
  ) { }

  async create(createDto: CreateTipoEspecificacionDto): Promise<TipoEspecificacion> {
    const existe = await this.repo.findOne({
      where: { nombre: createDto.nombre },
      withDeleted: true,
    });

    if (existe) {
      throw new BadRequestException('Ya existe un tipo de especificación con ese nombre');
    }

    // Validar que venga la unidad
    if (!createDto.unidad) {
      throw new BadRequestException('La unidad es requerida');
    }

    const nuevo = this.repo.create({
      nombre: createDto.nombre,
      unidad: createDto.unidad, // ¡Este es el campo faltante!
      estado: true, // Por defecto se crea como activo
    });

    return this.repo.save(nuevo);
  }

  findAll(includeInactive = false): Promise<TipoEspecificacion[]> {
    return this.repo.find({
      where: includeInactive ? {} : { estado: true },
      withDeleted: includeInactive,
    });
  }

  async findOne(id: number, includeInactive = false): Promise<TipoEspecificacion> {
    const tipo = await this.repo.findOne({
      where: { id },
      withDeleted: includeInactive,
    });

    if (!tipo || (!includeInactive && !tipo.estado)) {
      throw new NotFoundException('Tipo de especificación no encontrado');
    }

    return tipo;
  }

  async update(id: number, updateDto: UpdateTipoEspecificacionDto): Promise<TipoEspecificacion> {
    const tipo = await this.findOne(id, true);

    if (updateDto.nombre) {
      const duplicado = await this.repo.findOne({
        where: { nombre: updateDto.nombre },
        withDeleted: true,
      });

      if (duplicado && duplicado.id !== id) {
        throw new BadRequestException('Ya existe un tipo de especificación con ese nombre');
      }
      tipo.nombre = updateDto.nombre;
    }

    // Agregar manejo de unidad
    if (updateDto.unidad !== undefined) {
      tipo.unidad = updateDto.unidad;
    }

    if (updateDto.estado !== undefined) {
      tipo.estado = updateDto.estado;
    }

    return this.repo.save(tipo);
  }

  async remove(id: number): Promise<{ message: string }> {
    const tipo = await this.findOne(id);

    // Soft delete con TypeORM
    await this.repo.softRemove(tipo);

    // Además marcamos como inactivo
    tipo.estado = false;
    await this.repo.save(tipo);

    return { message: `Tipo de especificación con ID ${id} deshabilitado (soft delete).` };
  }

  async restore(id: number): Promise<{ message: string }> {
    const tipo = await this.findOne(id, true);

    if (!tipo.deletedAt) {
      throw new BadRequestException('El tipo de especificación no está eliminado');
    }

    // Restauramos el soft delete
    await this.repo.restore(id);

    // Lo marcamos como activo
    tipo.estado = true;
    await this.repo.save(tipo);

    return { message: `Tipo de especificación con ID ${id} restaurado.` };
  }

  async findAllPaginated(
    page: number,
    limit: number,
    search?: string,
    includeInactive = false,
  ): Promise<{ data: TipoEspecificacion[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = this.repo.createQueryBuilder('tipo');

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

  async toggleStatus(id: number): Promise<TipoEspecificacion> {
    const tipo = await this.findOne(id, true);

    tipo.estado = !tipo.estado;
    await this.repo.save(tipo);

    return tipo;
  }
}