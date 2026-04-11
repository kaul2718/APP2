import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, IsNull } from 'typeorm';
import { Presupuesto } from './entities/presupuesto.entity';
import { CreatePresupuestoDto } from './dto/create-presupuesto.dto';
import { UpdatePresupuestoDto } from './dto/update-presupuesto.dto';
import { Order } from 'src/orders/entities/order.entity';
import { EstadoPresupuesto } from '../estado-presupuesto/entities/estado-presupuesto.entity';
import { DetallePresupuestoItem } from 'src/detalle-presupuesto-item/entities/detalle-presupuesto-item.entity';
import { Inventario } from 'src/inventario/entities/inventario.entity';
import { DetalleManoObra } from 'src/detalle-mano-obra/entities/detalle-mano-obra.entity';

@Injectable()
export class PresupuestoService {
  constructor(
    @InjectRepository(Presupuesto)
    private readonly presupuestoRepository: Repository<Presupuesto>,

    @InjectRepository(Order)
    private readonly ordenRepository: Repository<Order>,

    @InjectRepository(EstadoPresupuesto)
    private readonly estadoPresupuestoRepository: Repository<EstadoPresupuesto>,

    @InjectRepository(DetallePresupuestoItem)
    private readonly detallePresupuestoItemsRepository: Repository<DetallePresupuestoItem>,

    @InjectRepository(Inventario)
    private readonly inventarioRepository: Repository<Inventario>,

    private readonly dataSource: DataSource,
  ) { }

  async create(createDto: CreatePresupuestoDto): Promise<Presupuesto> {
    const { ordenId, estadoId, descripcion } = createDto;

    const orden = await this.ordenRepository.findOne({ where: { id: ordenId } });
    if (!orden) throw new NotFoundException(`Orden con ID ${ordenId} no encontrada.`);

    // Validar si ya existe un presupuesto no eliminado para esta orden
    const existente = await this.presupuestoRepository.findOne({
      where: { ordenId, deletedAt: null },
    });
    if (existente) {
      throw new BadRequestException('Ya existe un presupuesto activo para esta orden.');
    }

    const estado = await this.estadoPresupuestoRepository.findOne({ where: { id: estadoId } });
    if (!estado) throw new NotFoundException(`EstadoPresupuesto con ID ${estadoId} no encontrado.`);

    const presupuesto = this.presupuestoRepository.create({
      ordenId,
      estadoId,
      descripcion,
      fechaEmision: new Date(),
    });

    try {
      return await this.presupuestoRepository.save(presupuesto);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new InternalServerErrorException(`Error creando presupuesto: ${message}`);
    }
  }

  async findAll(includeDeleted = false): Promise<Presupuesto[]> {
    const query = this.presupuestoRepository.createQueryBuilder('presupuesto')
      .leftJoinAndSelect('presupuesto.orden', 'orden')
      .leftJoinAndSelect('orden.client', 'client')
      .leftJoinAndSelect('orden.equipo', 'equipo')
      .leftJoinAndSelect('equipo.tipoEquipo', 'tipoEquipo')
      .leftJoinAndSelect('equipo.marca', 'marca')
      .leftJoinAndSelect('equipo.modelo', 'modelo')
      .leftJoinAndSelect('presupuesto.estado', 'estado')
      .leftJoinAndSelect('presupuesto.detallesManoObra', 'detallesManoObra')
      .leftJoinAndSelect('detallesManoObra.tipoManoObra', 'tipoManoObra')
      .leftJoinAndSelect('presupuesto.detallesPresupuestoItems', 'detallesPresupuestoItems')
      .leftJoinAndSelect('detallesPresupuestoItems.parte', 'parteDetalle')
      .orderBy('presupuesto.fechaEmision', 'DESC');

    if (!includeDeleted) {
      query.where('presupuesto.deletedAt IS NULL');
    }

    return query.getMany();
  }

  async findOne(id: number, includeDeleted = false): Promise<Presupuesto> {
    const query = this.presupuestoRepository.createQueryBuilder('presupuesto')
      .leftJoinAndSelect('presupuesto.orden', 'orden')
      .leftJoinAndSelect('orden.client', 'client')
      .leftJoinAndSelect('orden.equipo', 'equipo')
      .leftJoinAndSelect('equipo.tipoEquipo', 'tipoEquipo')
      .leftJoinAndSelect('equipo.marca', 'marca')
      .leftJoinAndSelect('equipo.modelo', 'modelo')
      .leftJoinAndSelect('presupuesto.estado', 'estado')
      .leftJoinAndSelect('presupuesto.detallesManoObra', 'detallesManoObra')
      .leftJoinAndSelect('detallesManoObra.tipoManoObra', 'tipoManoObra')
      .leftJoinAndSelect('presupuesto.detallesPresupuestoItems', 'detallesPresupuestoItems')
      .leftJoinAndSelect('detallesPresupuestoItems.parte', 'parteDetalle')
      .where('presupuesto.id = :id', { id });

    if (!includeDeleted) {
      query.andWhere('presupuesto.deletedAt IS NULL');
    }

    const presupuesto = await query.getOne();

    if (!presupuesto) {
      throw new NotFoundException(`Presupuesto con ID ${id} no encontrado.`);
    }

    return presupuesto;
  }

  async update(id: number, updateDto: UpdatePresupuestoDto): Promise<Presupuesto> {
    // Obtener presupuesto existente con relaciones necesarias
    const presupuesto = await this.presupuestoRepository.findOne({
      where: { id },
      relations: ['orden', 'orden.client', 'estado', 'detallesPresupuestoItems', 'detallesManoObra']
    });

    if (!presupuesto) {
      throw new NotFoundException(`Presupuesto con ID ${id} no encontrado.`);
    }

    // Manejo de cambio de orden
    if (updateDto.ordenId && updateDto.ordenId !== presupuesto.ordenId) {
      const orden = await this.ordenRepository.findOne({
        where: { id: updateDto.ordenId },
        relations: ['client']
      });

      if (!orden) {
        throw new NotFoundException(`Orden con ID ${updateDto.ordenId} no encontrada.`);
      }

      // Validar unicidad de presupuesto por orden
      const existente = await this.presupuestoRepository.findOne({
        where: {
          ordenId: updateDto.ordenId,
          deletedAt: IsNull()
        },
      });

      if (existente && existente.id !== id) {
        throw new BadRequestException('Ya existe un presupuesto activo para esta orden.');
      }

      presupuesto.ordenId = updateDto.ordenId;
      presupuesto.orden = orden;
    }

    // Manejo de cambio de estado
    if (updateDto.estadoId) {
      const nuevoEstado = await this.estadoPresupuestoRepository.findOne({
        where: { id: updateDto.estadoId }
      });

      if (!nuevoEstado) {
        throw new NotFoundException(`EstadoPresupuesto con ID ${updateDto.estadoId} no encontrado.`);
      }

      const estadoAnterior = presupuesto.estado;
      const estadoAnteriorNombre = estadoAnterior?.nombre?.toLowerCase() || '';
      const nuevoEstadoNombre = nuevoEstado.nombre.toLowerCase();

      // Solo procesar si realmente cambió el estado
      if (presupuesto.estadoId !== updateDto.estadoId) {
        // Lógica de inventario
        if (nuevoEstadoNombre === 'aprobado') {
          await this.descontarInventario(presupuesto.id);
        }
        else if (['rechazado', 'cancelado'].includes(nuevoEstadoNombre) &&
          ['aprobado', 'en proceso'].includes(estadoAnteriorNombre)) {
          await this.revertirInventario(presupuesto.id);
        }
      }

      presupuesto.estadoId = updateDto.estadoId;
      presupuesto.estado = nuevoEstado;
    }

    // Actualizar descripción si se proporciona
    if (updateDto.descripcion !== undefined) {
      presupuesto.descripcion = updateDto.descripcion;
    }

    // Guardar cambios
    await this.presupuestoRepository.save(presupuesto);

    // Devolver el presupuesto actualizado con todas las relaciones
    return this.presupuestoRepository.findOne({
      where: { id },
      relations: [
        'orden',
        'orden.client',
        'estado',
        'detallesManoObra',
        'detallesPresupuestoItems',
        'detallesPresupuestoItems.parte'
      ]
    });
  }


  async remove(id: number) {
    const presupuesto = await this.presupuestoRepository.findOne({
      where: { id },
      withDeleted: true // Para incluir eliminados lógicos
    });

    if (!presupuesto) {
      return null;
    }

    if (presupuesto.deletedAt) {
      // Ya estaba eliminado
      return false;
    }

    // Eliminación lógica (soft delete)
    await this.presupuestoRepository.softDelete(id);

    return true;
  }

  async restore(id: number): Promise<{ message: string }> {
    const presupuesto = await this.findOne(id, true);

    if (!presupuesto.deletedAt) {
      throw new BadRequestException('El presupuesto no está eliminado');
    }

    // Restauramos el soft delete
    await this.presupuestoRepository.restore(id);

    return { message: `Presupuesto con ID ${id} restaurado.` };
  }

  async findAllPaginated(
    page: number,
    limit: number,
    search?: string,
    includeDeleted = false,
  ): Promise<{ data: Presupuesto[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = this.presupuestoRepository.createQueryBuilder('presupuesto')
      .leftJoinAndSelect('presupuesto.orden', 'orden')
      .leftJoinAndSelect('orden.client', 'client')
      .leftJoinAndSelect('orden.equipo', 'equipo')
      .leftJoinAndSelect('equipo.tipoEquipo', 'tipoEquipo')
      .leftJoinAndSelect('equipo.marca', 'marca')
      .leftJoinAndSelect('equipo.modelo', 'modelo')
      .leftJoinAndSelect('presupuesto.estado', 'estado');

    if (search) {
      query.where('LOWER(presupuesto.descripcion) LIKE LOWER(:search)', {
        search: `%${search}%`
      });
    }

    if (!includeDeleted) {
      query.andWhere('presupuesto.deletedAt IS NULL');
    }

    query.skip(skip)
      .take(limit)
      .orderBy('presupuesto.fechaEmision', 'DESC');

    const [data, total] = await query.getManyAndCount();

    return { data, total };
  }

  private async descontarInventario(presupuestoId: number) {
    const detalles = await this.detallePresupuestoItemsRepository.find({
      where: { presupuestoId },
      relations: ['parte'],
    });

    for (const detalle of detalles) {
      const parteId = detalle.parteId ?? detalle.parte?.id;

      if (!parteId) {
        throw new NotFoundException(`No se pudo resolver la parte asociada al detalle ${detalle.id}.`);
      }

      const inventario = await this.inventarioRepository.findOne({
        where: {
          parteId,
          deletedAt: null,
        },
      });

      if (!inventario)
        throw new NotFoundException(`Inventario para parte ${parteId} no encontrado.`);

      if (inventario.cantidad < detalle.cantidad)
        throw new BadRequestException(`Stock insuficiente para parte ${parteId}`);

      inventario.cantidad -= detalle.cantidad;
      await this.inventarioRepository.save(inventario);
    }
  }

  private async revertirInventario(presupuestoId: number) {
    const detalles = await this.detallePresupuestoItemsRepository.find({
      where: { presupuestoId },
      relations: ['parte'],
    });

    for (const detalle of detalles) {
      const parteId = detalle.parteId ?? detalle.parte?.id;

      if (parteId) {
        const inventario = await this.inventarioRepository.findOne({
          where: {
            parteId,
            deletedAt: null,
          },
        });

        if (inventario) {
          inventario.cantidad += detalle.cantidad;
          await this.inventarioRepository.save(inventario);
        }
      }

      detalle.comentario = 'Detalle anulado por rechazo/cancelación de presupuesto';
      await this.detallePresupuestoItemsRepository.save(detalle);
    }
  }

  async getResumenPresupuesto(id: number) {
    const presupuesto = await this.presupuestoRepository.findOne({
      where: { id, deletedAt: null },
      relations: ['orden'],
    });
    if (!presupuesto) throw new NotFoundException('Presupuesto no encontrado');

    const detallesManoObra = await this.dataSource
      .getRepository(DetalleManoObra)
      .find({
        where: { presupuestoId: id },
        relations: ['tipoManoObra'],
      });

    const detallesPresupuestoItems = await this.dataSource
      .getRepository(DetallePresupuestoItem)
      .find({
        where: { presupuestoId: presupuesto.id },
        relations: ['parte'],
      });

    const costoManoObra = detallesManoObra.reduce((sum, d) => sum + Number(d.costoTotal), 0);
    const costoItems = detallesPresupuestoItems.reduce(
      (sum, d) => sum + Number(d.precioUnitario) * d.cantidad,
      0,
    );

    const resumen = {
      presupuestoId: presupuesto.id,
      descripcion: presupuesto.descripcion,
      fechaEmision: presupuesto.fechaEmision,
      orden: {
        numeroOrden: presupuesto.orden.workOrderNumber,
        clienteId: presupuesto.orden.clientId,
        equipoId: presupuesto.orden.equipoId,
      },
      detalleManoObra: detallesManoObra.map((d) => ({
        tipo: d.tipoManoObra?.nombre,
        cantidad: d.cantidad,
        costoUnitario: d.costoUnitario,
        costoTotal: d.costoTotal,
      })),
      detalleItems: detallesPresupuestoItems.map((d) => ({
        nombre: d.parte?.nombre || 'Ítem sin nombre',
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario,
        subtotal: d.cantidad * Number(d.precioUnitario),
      })),
      costoManoObra,
      costoItems,
      costoTotal: costoManoObra + costoItems,
    };

    return resumen;
  }
  async findByOrderId(orderId: number): Promise<Presupuesto[]> {
    return this.presupuestoRepository.find({
      where: {
        ordenId: orderId, // Corregido: usar el parámetro orderId
        deletedAt: IsNull()
      },
      relations: [
        'orden',
        'orden.client',
        'orden.equipo',
        'orden.equipo.tipoEquipo',
        'orden.equipo.marca',
        'orden.equipo.modelo',
        'estado',
        'detallesManoObra',
        'detallesManoObra.tipoManoObra',
        'detallesPresupuestoItems',
        'detallesPresupuestoItems.parte'
      ],
      order: {
        fechaEmision: 'DESC'
      }
    });
  }
}