import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Casillero } from './entities/casillero.entity';
import { Order } from '../orders/entities/order.entity';
import { EstadoCasillero } from '../common/enums/estadoCasillero.enum';
import { CreateCasilleroDto } from './dto/create-casillero.dto';
import { UpdateCasilleroDto } from './dto/update-casillero.dto';

@Injectable()
export class CasilleroService {
  constructor(
    @InjectRepository(Casillero)
    private readonly casilleroRepository: Repository<Casillero>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) { }

  async create(createDto: CreateCasilleroDto): Promise<Casillero> {
    const existe = await this.casilleroRepository.findOne({
      where: { codigo: createDto.codigo },
      withDeleted: true,
    });

    if (existe) {
      throw new BadRequestException('Ya existe un casillero con ese código');
    }

    const nuevo = this.casilleroRepository.create({
      codigo: createDto.codigo,
      descripcion: createDto.descripcion,
      situacion: EstadoCasillero.DISPONIBLE, // Valor fijo, no depende del DTO
      estado: true,
      order: null, // Asegurar que no tenga orden asignada
      orderId: null // Asegurar relación null
    });

    return this.casilleroRepository.save(nuevo);
  }

  async findAll(includeInactive = false): Promise<Casillero[]> {
    return this.casilleroRepository.find({
      where: includeInactive ? {} : { estado: true },
      withDeleted: includeInactive,
      relations: ['order'],
      order: { codigo: 'ASC' },
    });
  }

  async findOne(id: number, includeInactive = false): Promise<Casillero> {
    const casillero = await this.casilleroRepository.findOne({
      where: { id },
      withDeleted: includeInactive,
      relations: ['order'],
    });

    if (!casillero || (!includeInactive && !casillero.estado)) {
      throw new NotFoundException('Casillero no encontrado');
    }

    return casillero;
  }

  async findByCode(codigo: string, includeInactive = false): Promise<Casillero> {
    const casillero = await this.casilleroRepository.findOne({
      where: { codigo },
      withDeleted: includeInactive,
      relations: ['order'],
    });

    if (!casillero || (!includeInactive && !casillero.estado)) {
      throw new NotFoundException('Casillero no encontrado');
    }

    return casillero;
  }

  async update(id: number, updateDto: UpdateCasilleroDto): Promise<Casillero> {
    const casillero = await this.findOne(id, true);

    // Validación de código duplicado
    if (updateDto.codigo) {
      const duplicado = await this.casilleroRepository.findOne({
        where: { codigo: updateDto.codigo },
        withDeleted: true,
      });

      if (duplicado && duplicado.id !== id) {
        throw new BadRequestException('Ya existe un casillero con ese código');
      }
      casillero.codigo = updateDto.codigo;
    }

    // Actualización de descripción
    if (updateDto.descripcion) {
      casillero.descripcion = updateDto.descripcion;
    }

    // Actualización de estado con validación adicional
    if (updateDto.estado !== undefined) {
      if (updateDto.estado === false && casillero.situacion === EstadoCasillero.OCUPADO) {
        throw new BadRequestException('No se puede desactivar un casillero ocupado');
      }
      casillero.estado = updateDto.estado;
    }

    // Manejo explícito de la situación (opcional)
    if (updateDto.situacion) {
      // Aquí puedes agregar lógica adicional si es necesario
      casillero.situacion = updateDto.situacion;
    }

    return this.casilleroRepository.save(casillero);
  }

  async remove(id: number): Promise<{ message: string }> {
    const casillero = await this.findOne(id);

    // Verificar que el casillero no esté ocupado
    if (casillero.situacion === EstadoCasillero.OCUPADO) {
      throw new BadRequestException('No se puede eliminar un casillero ocupado');
    }

    // Soft delete con TypeORM
    await this.casilleroRepository.softRemove(casillero);

    // Además marcamos como inactivo
    casillero.estado = false;
    await this.casilleroRepository.save(casillero);

    return { message: `Casillero con ID ${id} deshabilitado (soft delete).` };
  }

  async restore(id: number): Promise<{ message: string }> {
    const casillero = await this.findOne(id, true);

    if (!casillero.deletedAt) {
      throw new BadRequestException('El casillero no está eliminado');
    }

    // Restauramos el soft delete
    await this.casilleroRepository.restore(id);

    // Lo marcamos como activo
    casillero.estado = true;
    await this.casilleroRepository.save(casillero);

    return { message: `Casillero con ID ${id} restaurado.` };
  }

  async assignOrder(casilleroId: number, orderId: number): Promise<Casillero> {
    const casillero = await this.findOne(casilleroId);
    const order = await this.orderRepository.findOne({
      where: { id: orderId }
    });

    if (!order) {
      throw new NotFoundException('Orden de servicio no encontrada');
    }

    // Verificar que el casillero esté disponible
    if (casillero.situacion === EstadoCasillero.OCUPADO) {
      throw new BadRequestException('El casillero ya está ocupado');
    }

    // Asignar la orden al casillero
    casillero.order = order;
    casillero.orderId = order.id;
    casillero.situacion = EstadoCasillero.OCUPADO;

    return this.casilleroRepository.save(casillero);
  }

  async releaseCasillero(id: number): Promise<Casillero> {
    const casillero = await this.findOne(id);

    // Verificar que el casillero esté ocupado
    if (casillero.situacion === EstadoCasillero.DISPONIBLE) {
      throw new BadRequestException('El casillero ya está disponible');
    }

    // Liberar el casillero
    casillero.order = null;
    casillero.orderId = null;
    casillero.situacion = EstadoCasillero.DISPONIBLE;

    return this.casilleroRepository.save(casillero);
  }

  async toggleStatus(id: number): Promise<Casillero> {
    const casillero = await this.findOne(id, true);

    // Verificar que no se desactive un casillero ocupado
    if (casillero.estado && casillero.situacion === EstadoCasillero.OCUPADO) {
      throw new BadRequestException('No se puede desactivar un casillero ocupado');
    }

    casillero.estado = !casillero.estado;
    await this.casilleroRepository.save(casillero);

    return casillero;
  }

  async findAllPaginated(
    page: number,
    limit: number,
    search?: string,
    includeInactive = false,
    situacion?: EstadoCasillero,
  ): Promise<{ data: Casillero[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = this.casilleroRepository.createQueryBuilder('casillero')
      .leftJoinAndSelect('casillero.order', 'order');

    if (search) {
      query.where('LOWER(casillero.codigo) LIKE LOWER(:search)', {
        search: `%${search}%`
      }).orWhere('LOWER(casillero.descripcion) LIKE LOWER(:search)', {
        search: `%${search}%`
      });
    }

    if (situacion) {
      query.andWhere('casillero.situacion = :situacion', { situacion });
    }

    if (!includeInactive) {
      query.andWhere('casillero.estado = :estado', { estado: true })
        .andWhere('casillero.deletedAt IS NULL');
    }

    query.skip(skip)
      .take(limit)
      .orderBy('casillero.codigo', 'ASC');

    const [data, total] = await query.getManyAndCount();

    return { data, total };
  }

  async findAvailable(): Promise<Casillero[]> {
    return this.casilleroRepository.find({
      where: {
        situacion: EstadoCasillero.DISPONIBLE,
        estado: true
      },
      order: { codigo: 'ASC' },
    });
  }

  async findOccupied(): Promise<Casillero[]> {
    return this.casilleroRepository.find({
      where: {
        situacion: EstadoCasillero.OCUPADO,
        estado: true
      },
      relations: ['order'],
      order: { codigo: 'ASC' },
    });
  }
}