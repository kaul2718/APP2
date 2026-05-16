import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, IsNull } from 'typeorm';
import { Presupuesto } from './entities/presupuesto.entity';
import { CreatePresupuestoDto } from './dto/create-presupuesto.dto';
import { UpdatePresupuestoDto } from './dto/update-presupuesto.dto';
import { Order } from 'src/orders/entities/order.entity';
import { EstadoPresupuesto } from '../estado-presupuesto/entities/estado-presupuesto.entity';
import { DetallePresupuestoItem } from 'src/detalle-presupuesto-item/entities/detalle-presupuesto-item.entity';
import { Parte } from 'src/parte/entities/parte.entity';
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

    @InjectRepository(Parte)
    private readonly parteRepository: Repository<Parte>,

    private readonly dataSource: DataSource,
  ) { }

  async create(createDto: CreatePresupuestoDto): Promise<Presupuesto> {
    const { ordenId, estadoId, descripcion } = createDto;

    const orden = await this.ordenRepository.findOne({ where: { id: ordenId } });
    if (!orden) throw new NotFoundException(`Orden con ID ${ordenId} no encontrada.`);

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
    const presupuesto = await this.presupuestoRepository.findOne({
      where: { id },
      relations: ['orden', 'orden.client', 'estado', 'detallesPresupuestoItems', 'detallesManoObra']
    });

    if (!presupuesto) {
      throw new NotFoundException(`Presupuesto con ID ${id} no encontrado.`);
    }

    if (updateDto.ordenId && updateDto.ordenId !== presupuesto.ordenId) {
      const orden = await this.ordenRepository.findOne({
        where: { id: updateDto.ordenId },
        relations: ['client']
      });

      if (!orden) throw new NotFoundException(`Orden con ID ${updateDto.ordenId} no encontrada.`);

      const existente = await this.presupuestoRepository.findOne({
        where: { ordenId: updateDto.ordenId, deletedAt: IsNull() },
      });

      if (existente && existente.id !== id) {
        throw new BadRequestException('Ya existe un presupuesto activo para esta orden.');
      }

      presupuesto.ordenId = updateDto.ordenId;
      presupuesto.orden = orden;
    }

    if (updateDto.estadoId) {
      const nuevoEstado = await this.estadoPresupuestoRepository.findOne({ where: { id: updateDto.estadoId } });
      if (!nuevoEstado) throw new NotFoundException(`Estado con ID ${updateDto.estadoId} no encontrado.`);

      const estadoAnteriorNombre = presupuesto.estado?.nombre?.toLowerCase() || '';
      const nuevoEstadoNombre = nuevoEstado.nombre.toLowerCase();

      if (presupuesto.estadoId !== updateDto.estadoId) {
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

    if (updateDto.descripcion !== undefined) {
      presupuesto.descripcion = updateDto.descripcion;
    }

    await this.presupuestoRepository.save(presupuesto);

    return this.findOne(id);
  }

  async remove(id: number) {
    const presupuesto = await this.presupuestoRepository.findOne({ where: { id }, withDeleted: true });
    if (!presupuesto) return null;
    if (presupuesto.deletedAt) return false;
    await this.presupuestoRepository.softDelete(id);
    return true;
  }

  async restore(id: number): Promise<{ message: string }> {
    const presupuesto = await this.findOne(id, true);
    if (!presupuesto.deletedAt) throw new BadRequestException('El presupuesto no está eliminado');
    await this.presupuestoRepository.restore(id);
    return { message: `Presupuesto con ID ${id} restaurado.` };
  }

  async findAllPaginated(
    page: any,
    limit: any,
    search?: string,
    includeDeleted = false,
  ): Promise<{ data: Presupuesto[]; total: number }> {
    const limitNum = Number(limit) || 10;
    const pageNum = Number(page) || 1;
    const skip = (pageNum - 1) * limitNum;

    const query = this.presupuestoRepository.createQueryBuilder('presupuesto')
      .leftJoinAndSelect('presupuesto.orden', 'orden')
      .leftJoinAndSelect('orden.client', 'client')
      .leftJoinAndSelect('orden.equipo', 'equipo')
      .leftJoinAndSelect('equipo.tipoEquipo', 'tipoEquipo')
      .leftJoinAndSelect('equipo.marca', 'marca')
      .leftJoinAndSelect('equipo.modelo', 'modelo')
      .leftJoinAndSelect('presupuesto.estado', 'estado');

    if (search) {
      query.where('LOWER(presupuesto.descripcion) LIKE LOWER(:search)', { search: `%${search}%` });
    }

    if (!includeDeleted) query.andWhere('presupuesto.deletedAt IS NULL');

    query.skip(skip).take(limitNum).orderBy('presupuesto.fechaEmision', 'DESC');

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
      if (!parteId) throw new NotFoundException(`No se pudo resolver la parte asociada al detalle ${detalle.id}.`);

      const parte = await this.parteRepository.findOne({ where: { id: parteId } });
      if (!parte) throw new NotFoundException(`Producto de almacén con ID ${parteId} no encontrado.`);

      if (parte.stock < detalle.cantidad)
        throw new BadRequestException(`Existencias insuficientes para ${parte.nombre}. Disponible: ${parte.stock}`);

      parte.stock -= detalle.cantidad;
      await this.parteRepository.save(parte);
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
        const parte = await this.parteRepository.findOne({ where: { id: parteId } });
        if (parte) {
          parte.stock += detalle.cantidad;
          await this.parteRepository.save(parte);
        }
      }
      detalle.comentario = 'Stock devuelto por anulación de presupuesto';
      await this.detallePresupuestoItemsRepository.save(detalle);
    }
  }

  async getResumenPresupuesto(id: number) {
    const presupuesto = await this.presupuestoRepository.findOne({
      where: { id, deletedAt: null },
      relations: ['orden'],
    });
    if (!presupuesto) throw new NotFoundException('Presupuesto no encontrado');

    const detallesManoObra = await this.dataSource.getRepository(DetalleManoObra).find({
      where: { presupuestoId: id },
      relations: ['tipoManoObra'],
    });

    const detallesPresupuestoItems = await this.dataSource.getRepository(DetallePresupuestoItem).find({
      where: { presupuestoId: presupuesto.id },
      relations: ['parte'],
    });

    const costoManoObra = detallesManoObra.reduce((sum, d) => sum + Number(d.costoTotal), 0);
    const costoItems = detallesPresupuestoItems.reduce((sum, d) => sum + Number(d.precioUnitario) * d.cantidad, 0);

    return {
      presupuestoId: presupuesto.id,
      descripcion: presupuesto.descripcion,
      fechaEmision: presupuesto.fechaEmision,
      orden: {
        numeroOrden: presupuesto.orden.workOrderNumber,
        clienteId: presupuesto.orden.clientId,
        equipoId: presupuesto.orden.equipoId,
      },
      detalleManoObra: detallesManoObra.map((d) => ({
        id: d.id,
        tipo: d.tipoManoObra?.nombre,
        cantidad: d.cantidad,
        costoUnitario: d.costoUnitario,
        costoTotal: d.costoTotal,
        estado: d.estado,
      })),
      detalleItems: detallesPresupuestoItems.map((d) => ({
        id: d.id,
        nombre: d.parte?.nombre || 'Ítem sin nombre',
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario,
        subtotal: d.cantidad * Number(d.precioUnitario),
        estado: d.estado,
      })),
      costoManoObra,
      costoItems,
      costoTotal: costoManoObra + costoItems,
    };
  }

  async findByOrderId(orderId: number): Promise<Presupuesto[]> {
    return this.presupuestoRepository.find({
      where: { ordenId: orderId, deletedAt: IsNull() },
      relations: [
        'orden', 'orden.client', 'orden.equipo', 'orden.equipo.tipoEquipo', 
        'orden.equipo.marca', 'orden.equipo.modelo', 'estado', 
        'detallesManoObra', 'detallesManoObra.tipoManoObra', 
        'detallesPresupuestoItems', 'detallesPresupuestoItems.parte'
      ],
      order: { fechaEmision: 'DESC' }
    });
  }
}