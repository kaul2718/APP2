import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Inventario } from './entities/inventario.entity';
import { Parte } from '../parte/entities/parte.entity';
import { CreateInventarioDto } from './dto/create-inventario.dto';
import { UpdateInventarioDto } from './dto/update-inventario.dto';

@Injectable()
export class InventarioService {
  constructor(
    @InjectRepository(Inventario)
    private readonly inventarioRepository: Repository<Inventario>,
    @InjectRepository(Parte)
    private readonly parteRepository: Repository<Parte>,
  ) { }

  async create(createDto: CreateInventarioDto): Promise<Inventario> {
    // Verificar si ya existe un inventario para esta parte en esta ubicación
    const existe = await this.inventarioRepository.findOne({
      where: {
        parteId: createDto.parteId,
        ubicacion: createDto.ubicacion
      },
      withDeleted: true,
    });

    if (existe) {
      throw new BadRequestException('Ya existe un registro de inventario para esta parte en esta ubicación');
    }

    const parte = await this.parteRepository.findOne({
      where: { id: createDto.parteId }
    });
    if (!parte) {
      throw new NotFoundException('Parte no encontrada');
    }

    const nuevo = this.inventarioRepository.create({
      cantidad: createDto.cantidad,
      stockMinimo: createDto.stockMinimo,
      ubicacion: createDto.ubicacion,
      parte,
      estado: true, // Por defecto se crea como activo
    });

    return this.inventarioRepository.save(nuevo);
  }

  findAll(includeInactive = false): Promise<Inventario[]> {
    return this.inventarioRepository.find({
      where: includeInactive ? {} : { estado: true },
      withDeleted: includeInactive,
      relations: ['parte'],
    });
  }

  async findOne(id: number, includeInactive = false): Promise<Inventario> {
    const inventario = await this.inventarioRepository.findOne({
      where: { id },
      withDeleted: includeInactive,
      relations: ['parte'],
    });

    if (!inventario || (!includeInactive && !inventario.estado)) {
      throw new NotFoundException('Registro de inventario no encontrado');
    }

    return inventario;
  }

  async update(id: number, updateDto: UpdateInventarioDto): Promise<Inventario> {
    const inventario = await this.findOne(id, true);

    if (updateDto.parteId) {
      const parte = await this.parteRepository.findOne({
        where: { id: updateDto.parteId }
      });
      if (!parte) {
        throw new NotFoundException('Parte no encontrada');
      }
      inventario.parte = parte;
    }

    if (updateDto.ubicacion) {
      // Verificar si ya existe otro registro con la misma ubicación para la misma parte
      const existeUbicacion = await this.inventarioRepository.findOne({
        where: {
          parteId: inventario.parte.id,
          ubicacion: updateDto.ubicacion,
          id: Not(inventario.id) // Excluir el registro actual
        },
        withDeleted: true,
      });

      if (existeUbicacion) {
        throw new BadRequestException('Ya existe un registro de inventario para esta parte en esta ubicación');
      }

      inventario.ubicacion = updateDto.ubicacion;
    }

    if (updateDto.cantidad !== undefined) {
      inventario.cantidad = updateDto.cantidad;
    }

    if (updateDto.stockMinimo !== undefined) {
      inventario.stockMinimo = updateDto.stockMinimo;
    }

    if (updateDto.estado !== undefined) {
      inventario.estado = updateDto.estado;
    }

    return this.inventarioRepository.save(inventario);
  }

  async remove(id: number): Promise<{ message: string }> {
    const inventario = await this.findOne(id);

    // Soft delete con TypeORM
    await this.inventarioRepository.softRemove(inventario);

    // Además marcamos como inactivo
    inventario.estado = false;
    await this.inventarioRepository.save(inventario);

    return { message: `Registro de inventario con ID ${id} deshabilitado (soft delete).` };
  }

  async restore(id: number): Promise<{ message: string }> {
    const inventario = await this.findOne(id, true);

    if (!inventario.deletedAt) {
      throw new BadRequestException('El registro de inventario no está eliminado');
    }

    // Restauramos el soft delete
    await this.inventarioRepository.restore(id);

    // Lo marcamos como activo
    inventario.estado = true;
    await this.inventarioRepository.save(inventario);

    return { message: `Registro de inventario con ID ${id} restaurado.` };
  }

  async findAllPaginated(
    page: number,
    limit: number,
    search?: string,
    includeInactive = false,
  ): Promise<{ data: Inventario[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = this.inventarioRepository.createQueryBuilder('inventario')
      .leftJoinAndSelect('inventario.parte', 'parte');

    if (search) {
      query.where(
        '(LOWER(inventario.ubicacion) LIKE LOWER(:search) OR LOWER(parte.nombre) LIKE LOWER(:search))',
        { search: `%${search}%` }
      );
    }

    if (!includeInactive) {
      query.andWhere('inventario.estado = :estado', { estado: true })
        .andWhere('inventario.deletedAt IS NULL');
    }

    query.skip(skip)
      .take(limit)
      .orderBy('inventario.ubicacion', 'ASC');

    const [data, total] = await query.getManyAndCount();

    return { data, total };
  }

  async toggleStatus(id: number): Promise<Inventario> {
    const inventario = await this.findOne(id, true);

    inventario.estado = !inventario.estado;
    await this.inventarioRepository.save(inventario);

    return inventario;
  }

  // Métodos adicionales específicos para inventario
  async checkStock(id: number): Promise<{ suficiente: boolean; diferencia?: number }> {
    const inventario = await this.findOne(id);

    if (inventario.cantidad >= inventario.stockMinimo) {
      return { suficiente: true };
    }

    return {
      suficiente: false,
      diferencia: inventario.stockMinimo - inventario.cantidad
    };
  }

  async updateStock(id: number, cantidad: number, operacion: 'add' | 'subtract'): Promise<Inventario> {
    const inventario = await this.findOne(id);

    if (operacion === 'add') {
      inventario.cantidad += cantidad;
    } else {
      if (inventario.cantidad < cantidad) {
        throw new BadRequestException('No hay suficiente stock para realizar esta operación');
      }
      inventario.cantidad -= cantidad;
    }

    return this.inventarioRepository.save(inventario);
  }
  // En inventario.service.ts
  async findLowStockPaginated(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: Inventario[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = this.inventarioRepository.createQueryBuilder('inventario')
      .leftJoinAndSelect('inventario.parte', 'parte')
      .where('inventario.cantidad < inventario.stockMinimo')
      .andWhere('inventario.estado = :estado', { estado: true })
      .andWhere('inventario.deletedAt IS NULL');

    const [data, total] = await query
      .skip(skip)
      .take(limit)
      .orderBy('inventario.cantidad', 'ASC')
      .getManyAndCount();

    return { data, total };
  }
}