import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoManoObra } from './entities/tipo-mano-obra.entity';
import { CreateTipoManoObraDto } from './dto/create-tipo-mano-obra.dto';
import { UpdateTipoManoObraDto } from './dto/update-tipo-mano-obra.dto';

@Injectable()
export class TipoManoObraService {
  constructor(
    @InjectRepository(TipoManoObra)
    private readonly tipoManoObraRepository: Repository<TipoManoObra>,
  ) {}

  async create(createDto: CreateTipoManoObraDto): Promise<TipoManoObra> {
    // Verificar si ya existe un tipo con el mismo código o nombre
    const existeCodigo = await this.tipoManoObraRepository.findOne({
      where: { codigo: createDto.codigo },
      withDeleted: true,
    });

    if (existeCodigo) {
      throw new BadRequestException('Ya existe un tipo de mano de obra con ese código');
    }

    const existeNombre = await this.tipoManoObraRepository.findOne({
      where: { nombre: createDto.nombre },
      withDeleted: true,
    });

    if (existeNombre) {
      throw new BadRequestException('Ya existe un tipo de mano de obra con ese nombre');
    }

    const nuevo = this.tipoManoObraRepository.create({
      ...createDto,
      estado: createDto.estado !== undefined ? createDto.estado : true, // Por defecto activo
    });

    return this.tipoManoObraRepository.save(nuevo);
  }

  findAll(includeInactive = false): Promise<TipoManoObra[]> {
    return this.tipoManoObraRepository.find({
      where: includeInactive ? {} : { estado: true },
      withDeleted: includeInactive,
      relations: ['detalles'],
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number, includeInactive = false): Promise<TipoManoObra> {
    const tipo = await this.tipoManoObraRepository.findOne({
      where: { id },
      withDeleted: includeInactive,
      relations: ['detalles'],
    });

    if (!tipo || (!includeInactive && !tipo.estado)) {
      throw new NotFoundException('Tipo de mano de obra no encontrado');
    }

    return tipo;
  }

  async update(id: number, updateDto: UpdateTipoManoObraDto): Promise<TipoManoObra> {
    const tipo = await this.findOne(id, true);

    // Verificar duplicados en código
    if (updateDto.codigo) {
      const existeCodigo = await this.tipoManoObraRepository.findOne({
        where: { codigo: updateDto.codigo },
        withDeleted: true,
      });

      if (existeCodigo && existeCodigo.id !== id) {
        throw new BadRequestException('Ya existe un tipo de mano de obra con ese código');
      }
    }

    // Verificar duplicados en nombre
    if (updateDto.nombre) {
      const existeNombre = await this.tipoManoObraRepository.findOne({
        where: { nombre: updateDto.nombre },
        withDeleted: true,
      });

      if (existeNombre && existeNombre.id !== id) {
        throw new BadRequestException('Ya existe un tipo de mano de obra con ese nombre');
      }
    }

    // Actualizar campos
    if (updateDto.nombre) tipo.nombre = updateDto.nombre;
    if (updateDto.codigo) tipo.codigo = updateDto.codigo;
    if (updateDto.descripcion !== undefined) tipo.descripcion = updateDto.descripcion;
    if (updateDto.costo !== undefined) tipo.costo = updateDto.costo;
    if (updateDto.estado !== undefined) tipo.estado = updateDto.estado;

    return this.tipoManoObraRepository.save(tipo);
  }

  async remove(id: number): Promise<{ message: string }> {
    const tipo = await this.findOne(id);
    
    // Verificar si hay detalles asociados antes de eliminar
    if (tipo.detalles && tipo.detalles.length > 0) {
      throw new BadRequestException('No se puede eliminar el tipo de mano de obra porque tiene detalles asociados');
    }

    // Soft delete
    await this.tipoManoObraRepository.softRemove(tipo);
    
    // Marcar como inactivo
    tipo.estado = false;
    await this.tipoManoObraRepository.save(tipo);
    
    return { message: `Tipo de mano de obra con ID ${id} deshabilitado (soft delete).` };
  }

  async restore(id: number): Promise<{ message: string }> {
    const tipo = await this.findOne(id, true);

    if (!tipo.deletedAt) {
      throw new BadRequestException('El tipo de mano de obra no está eliminado');
    }

    // Restaurar soft delete
    await this.tipoManoObraRepository.restore(id);
    
    // Marcar como activo
    tipo.estado = true;
    await this.tipoManoObraRepository.save(tipo);
    
    return { message: `Tipo de mano de obra con ID ${id} restaurado.` };
  }

  async findAllPaginated(
    page: number,
    limit: number,
    search?: string,
    includeInactive = false,
  ): Promise<{ data: TipoManoObra[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = this.tipoManoObraRepository.createQueryBuilder('tipo')
      .leftJoinAndSelect('tipo.detalles', 'detalles');

    if (search) {
      query.where(
        '(LOWER(tipo.nombre) LIKE LOWER(:search) OR LOWER(tipo.codigo) LIKE LOWER(:search))', 
        { search: `%${search}%` }
      );
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

  async toggleStatus(id: number): Promise<TipoManoObra> {
    const tipo = await this.findOne(id, true);
    
    tipo.estado = !tipo.estado;
    await this.tipoManoObraRepository.save(tipo);
    
    return tipo;
  }

  async findByCodigo(codigo: string): Promise<TipoManoObra> {
    const tipo = await this.tipoManoObraRepository.findOne({
      where: { codigo, estado: true },
    });

    if (!tipo) {
      throw new NotFoundException('Tipo de mano de obra no encontrado o inactivo');
    }

    return tipo;
  }
}