import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DetallePresupuestoItem } from './entities/detalle-presupuesto-item.entity';
import { CreateDetallePresupuestoItemDto } from './dto/create-detalle-presupuesto-item.dto';
import { UpdateDetallePresupuestoItemDto } from './dto/update-detalle-presupuesto-item.dto';
import { Presupuesto } from '../presupuesto/entities/presupuesto.entity';
import { Parte } from '../parte/entities/parte.entity';
import { NotificacionService } from '../notificacion/notificacion.service';

@Injectable()
export class DetallePresupuestoItemService {
  constructor(
    @InjectRepository(DetallePresupuestoItem)
    private readonly detalleRepository: Repository<DetallePresupuestoItem>,
    @InjectRepository(Presupuesto)
    private readonly presupuestoRepository: Repository<Presupuesto>,
    @InjectRepository(Parte)
    private readonly parteRepository: Repository<Parte>,
    private readonly notificacionService: NotificacionService,
  ) { }

  private async resolveParteSelection(parteId?: number): Promise<Parte> {
    if (!parteId) throw new BadRequestException('Debe proporcionar parteId');

    const parte = await this.parteRepository.findOne({
      where: { id: parteId },
      withDeleted: true,
    });

    if (!parte) throw new NotFoundException(`Producto con ID ${parteId} no encontrado`);
    if (parte.deletedAt || !parte.estado) throw new BadRequestException('El producto seleccionado está inactivo');

    return parte;
  }

  async create(createDto: CreateDetallePresupuestoItemDto): Promise<DetallePresupuestoItem> {
    const { parteId, cantidad, presupuestoId } = createDto;

    const parte = await this.resolveParteSelection(parteId);
    const presupuesto = await this.presupuestoRepository.findOne({
      where: { id: presupuestoId },
      withDeleted: true,
      relations: ['orden', 'estado'],
    });

    if (!presupuesto) throw new NotFoundException(`Presupuesto con ID ${presupuestoId} no encontrado`);
    if (cantidad <= 0) throw new BadRequestException('La cantidad debe ser mayor a 0');

    if (parte.unidadMedida !== 'Servicio' && Number(parte.stock) < cantidad) {
      throw new BadRequestException(`Existencias insuficientes. Stock actual: ${parte.stock}`);
    }

    const precioUnitario = createDto.precioUnitario !== undefined 
      ? Number(createDto.precioUnitario)
      : Number(parte.precio1 ?? 0);
    const subtotal = precioUnitario * cantidad;

    const detalle = this.detalleRepository.create({
      cantidad,
      precioUnitario,
      subtotal,
      fechaUso: new Date(),
      presupuestoId,
      parteId: parte.id,
      parte,
      comentario: createDto.comentario ?? null,
      estado: true,
      estadoOrdenId: presupuesto.orden?.estadoOrdenId || null,
    });

    // Si el presupuesto ya está aprobado, descontamos del inventario inmediatamente
    if (presupuesto.estado?.nombre?.toLowerCase() === 'aprobado' && parte.unidadMedida !== 'Servicio') {
      parte.stock = Number(parte.stock) - cantidad;
      await this.parteRepository.save(parte);
      await this.notificacionService.checkAndNotificarStockBajo(parte.id);
    }

    const detalleGuardado = await this.detalleRepository.save(detalle);
    return this.findOne(detalleGuardado.id, true);
  }

  async findAll(includeInactive = false): Promise<DetallePresupuestoItem[]> {
    return this.detalleRepository.find({
      where: includeInactive ? {} : { estado: true },
      withDeleted: includeInactive,
      relations: ['parte', 'presupuesto'],
    });
  }

  async findOne(id: number, includeInactive = false): Promise<DetallePresupuestoItem> {
    const detalle = await this.detalleRepository.findOne({
      where: { id },
      withDeleted: includeInactive,
      relations: ['parte', 'presupuesto'],
    });

    if (!detalle || (!includeInactive && !detalle.estado)) {
      throw new NotFoundException(`Detalle con ID ${id} no encontrado`);
    }

    return detalle;
  }

  async update(id: number, updateDto: UpdateDetallePresupuestoItemDto): Promise<DetallePresupuestoItem> {
    const detalle = await this.detalleRepository.findOne({
      where: { id },
      relations: ['parte', 'presupuesto', 'presupuesto.estado'],
      withDeleted: true
    });

    if (!detalle) throw new NotFoundException(`Detalle con ID ${id} no encontrado`);

    if (updateDto.cantidad !== undefined && updateDto.cantidad <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor a 0');
    }

    const isApproved = detalle.presupuesto?.estado?.nombre?.toLowerCase() === 'aprobado';

    let parteActualizada: Parte | null = null;
    if (updateDto.parteId !== undefined && updateDto.parteId !== detalle.parteId) {
      parteActualizada = await this.resolveParteSelection(updateDto.parteId);
      const cantidad = updateDto.cantidad !== undefined ? updateDto.cantidad : detalle.cantidad;
      
      // Si el presupuesto está aprobado, revertimos stock de la parte anterior y descontamos de la nueva
      if (isApproved) {
        if (detalle.parte && detalle.parte.unidadMedida !== 'Servicio') {
          detalle.parte.stock = Number(detalle.parte.stock) + detalle.cantidad;
          await this.parteRepository.save(detalle.parte);
        }
        if (parteActualizada.unidadMedida !== 'Servicio') {
          if (Number(parteActualizada.stock) < cantidad) {
            // Revertir para mantener estado consistente
            if (detalle.parte && detalle.parte.unidadMedida !== 'Servicio') {
              detalle.parte.stock = Number(detalle.parte.stock) - detalle.cantidad;
              await this.parteRepository.save(detalle.parte);
            }
            throw new BadRequestException(`Existencias insuficientes para el nuevo repuesto. Stock actual: ${parteActualizada.stock}`);
          }
          parteActualizada.stock = Number(parteActualizada.stock) - cantidad;
          await this.parteRepository.save(parteActualizada);
          await this.notificacionService.checkAndNotificarStockBajo(parteActualizada.id);
        }
      } else {
        if (parteActualizada.unidadMedida !== 'Servicio' && Number(parteActualizada.stock) < cantidad) {
          throw new BadRequestException(`Existencias insuficientes. Stock actual: ${parteActualizada.stock}`);
        }
      }

      detalle.parte = parteActualizada;
      detalle.parteId = parteActualizada.id;
    }

    if (updateDto.cantidad !== undefined && updateDto.parteId === undefined) {
      const p = detalle.parte;
      if (p && p.unidadMedida !== 'Servicio') {
        const oldQty = detalle.cantidad;
        const newQty = updateDto.cantidad;
        const diff = newQty - oldQty;

        if (isApproved) {
          if (Number(p.stock) < diff) {
            throw new BadRequestException(`Existencias insuficientes para aumentar cantidad. Disponible: ${p.stock}`);
          }
          p.stock = Number(p.stock) - diff;
          await this.parteRepository.save(p);
          await this.notificacionService.checkAndNotificarStockBajo(p.id);
        } else {
          if (Number(p.stock) < newQty) {
            throw new BadRequestException(`Existencias insuficientes. Stock actual: ${p.stock}`);
          }
        }
      }
      detalle.cantidad = updateDto.cantidad;
    } else if (updateDto.cantidad !== undefined) {
      detalle.cantidad = updateDto.cantidad;
    }

    if (parteActualizada || updateDto.cantidad !== undefined) {
      const p = parteActualizada ?? detalle.parte;
      const precioUnitario = Number(p?.precio1 ?? 0);
      detalle.precioUnitario = precioUnitario;
      detalle.subtotal = precioUnitario * detalle.cantidad;
    }

    if (updateDto.comentario !== undefined) detalle.comentario = updateDto.comentario;
    if (updateDto.estado !== undefined) detalle.estado = updateDto.estado;
    if (updateDto.presupuestoId !== undefined) detalle.presupuestoId = updateDto.presupuestoId;

    const detalleActualizado = await this.detalleRepository.save(detalle);
    return this.findOne(detalleActualizado.id, true);
  }

  async remove(id: number): Promise<{ message: string }> {
    const detalle = await this.detalleRepository.findOne({
      where: { id },
      relations: ['parte', 'presupuesto', 'presupuesto.estado'],
    });
    if (!detalle) throw new NotFoundException(`Detalle con ID ${id} no encontrado`);

    // Si el presupuesto está aprobado, devolvemos el stock al almacén
    if (detalle.presupuesto?.estado?.nombre?.toLowerCase() === 'aprobado' && detalle.parte?.unidadMedida !== 'Servicio') {
      detalle.parte.stock = Number(detalle.parte.stock) + detalle.cantidad;
      await this.parteRepository.save(detalle.parte);
    }

    detalle.estado = false;
    await this.detalleRepository.save(detalle);
    await this.detalleRepository.softRemove(detalle);
    return { message: `Detalle con ID ${id} eliminado lógicamente.` };
  }

  async restore(id: number): Promise<{ message: string }> {
    const detalle = await this.findOne(id, true);
    if (!detalle.deletedAt) throw new BadRequestException('El detalle no está eliminado');
    await this.detalleRepository.restore(id);
    detalle.estado = true;
    await this.detalleRepository.save(detalle);
    return { message: `Detalle con ID ${id} restaurado.` };
  }

  async findByPresupuesto(presupuestoId: number, includeInactive = false): Promise<DetallePresupuestoItem[]> {
    const query = this.detalleRepository.createQueryBuilder('detalle')
      .leftJoinAndSelect('detalle.parte', 'parteDirecta')
      .leftJoinAndSelect('detalle.presupuesto', 'presupuesto')
      .where('detalle.presupuestoId = :presupuestoId', { presupuestoId });

    if (!includeInactive) {
      query.andWhere('detalle.estado = :estado', { estado: true })
        .andWhere('detalle.deletedAt IS NULL');
    }

    return query.orderBy('detalle.createdAt', 'DESC').getMany();
  }

  async findByOrder(orderId: number, includeInactive = false): Promise<DetallePresupuestoItem[]> {
    const query = this.detalleRepository.createQueryBuilder('detalle')
      .leftJoinAndSelect('detalle.parte', 'parteDirecta')
      .leftJoinAndSelect('detalle.presupuesto', 'presupuesto')
      .where('presupuesto.ordenId = :orderId', { orderId });

    if (!includeInactive) {
      query.andWhere('detalle.estado = :estado', { estado: true })
        .andWhere('detalle.deletedAt IS NULL');
    }

    return query.orderBy('detalle.createdAt', 'DESC').getMany();
  }

  async getTotalByPresupuesto(presupuestoId: number, includeInactive = false) {
    const detallesPresupuesto = await this.findByPresupuesto(presupuestoId, includeInactive);
    const total = detallesPresupuesto.reduce((sum, detalle) => sum + Number(detalle.subtotal), 0);

    return {
      totalItems: total,
      cantidadItems: detallesPresupuesto.length,
      detalles: detallesPresupuesto,
    };
  }

  async getTotalByOrder(orderId: number, includeInactive = false) {
    const detallesOrden = await this.findByOrder(orderId, includeInactive);
    const total = detallesOrden.reduce((sum, detalle) => sum + Number(detalle.subtotal), 0);

    return {
      totalItems: total,
      cantidadItems: detallesOrden.length,
      detalles: detallesOrden,
    };
  }

  async findAllPaginated(
    page: number,
    limit: number,
    search?: string,
    includeInactive = false,
  ): Promise<{ data: DetallePresupuestoItem[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = this.detalleRepository.createQueryBuilder('detalle')
      .leftJoinAndSelect('detalle.parte', 'parteDirecta')
      .leftJoinAndSelect('detalle.presupuesto', 'presupuesto');

    if (search) {
      query.where(`LOWER(COALESCE(parteDirecta.nombre, '')) LIKE LOWER(:search)`, {
        search: `%${search}%`,
      });
    }

    if (!includeInactive) {
      query.andWhere('detalle.estado = :estado', { estado: true })
        .andWhere('detalle.deletedAt IS NULL');
    }

    query.skip(skip).take(limit).orderBy('detalle.createdAt', 'DESC');

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  async toggleStatus(id: number): Promise<DetallePresupuestoItem> {
    const detalle = await this.findOne(id, true);
    detalle.estado = !detalle.estado;
    await this.detalleRepository.save(detalle);
    return detalle;
  }
}
