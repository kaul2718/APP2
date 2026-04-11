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
import { Inventario } from '../inventario/entities/inventario.entity';
import { Parte } from '../parte/entities/parte.entity';

@Injectable()
export class DetallePresupuestoItemService {
  constructor(
    @InjectRepository(DetallePresupuestoItem)
    private readonly detalleRepository: Repository<DetallePresupuestoItem>,
    @InjectRepository(Presupuesto)
    private readonly presupuestoRepository: Repository<Presupuesto>,
    @InjectRepository(Inventario)
    private readonly inventarioRepository: Repository<Inventario>,
    @InjectRepository(Parte)
    private readonly parteRepository: Repository<Parte>,
  ) { }

  private async resolveParteSelection(parteId?: number): Promise<Parte> {
    if (!parteId) {
      throw new BadRequestException('Debe proporcionar parteId');
    }

    const parte = await this.parteRepository.findOne({
      where: { id: parteId },
      withDeleted: true,
    });

    if (!parte) {
      throw new NotFoundException(`Parte con ID ${parteId} no encontrada`);
    }

    if (parte.deletedAt || !parte.estado) {
      throw new BadRequestException('La parte seleccionada está inactiva');
    }

    return parte;
  }

  async create(createDto: CreateDetallePresupuestoItemDto): Promise<DetallePresupuestoItem> {
    const { parteId, cantidad, presupuestoId } = createDto;

    const parte = await this.resolveParteSelection(parteId);

    const presupuesto = await this.presupuestoRepository.findOne({
      where: { id: presupuestoId },
      withDeleted: true,
    });
    if (!presupuesto) {
      throw new NotFoundException(`Presupuesto con ID ${presupuestoId} no encontrado`);
    }

    if (cantidad <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor a 0');
    }

    const inventario = await this.inventarioRepository.findOne({
      where: {
        parteId: parte.id,
        deletedAt: null,
      },
    });

    if (!inventario) {
      throw new NotFoundException(`Inventario para parte ID ${parte.id} no encontrado`);
    }

    if (inventario.cantidad < cantidad) {
      throw new BadRequestException(`No hay suficiente stock disponible. Stock actual: ${inventario.cantidad}`);
    }

    const precioUnitario = Number(parte.precioReferencia ?? 0);
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
    });

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
      throw new NotFoundException(`DetalleRepuesto con ID ${id} no encontrado`);
    }

    return detalle;
  }

  async update(id: number, updateDto: UpdateDetallePresupuestoItemDto): Promise<DetallePresupuestoItem> {
    // Obtener el detalle existente incluyendo relaciones
    const detalle = await this.detalleRepository.findOne({
      where: { id },
      relations: ['parte', 'presupuesto'],
      withDeleted: true
    });

    if (!detalle) {
      throw new NotFoundException(`DetalleRepuesto con ID ${id} no encontrado`);
    }

    // Validación de cantidad
    if (updateDto.cantidad !== undefined && updateDto.cantidad <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor a 0');
    }

    // Manejo de cambio de ítem usando `parteId` como referencia única
    let parteActualizada: Parte | null = null;
    if (updateDto.parteId !== undefined) {
      const mismaSeleccionPorParte = updateDto.parteId === detalle.parteId;

      if (!mismaSeleccionPorParte) {
        parteActualizada = await this.resolveParteSelection(updateDto.parteId);

        const inventario = await this.inventarioRepository.findOne({
          where: { parteId: parteActualizada.id, deletedAt: null }
        });

        if (!inventario) {
          throw new NotFoundException(`Inventario para parte ID ${parteActualizada.id} no encontrado`);
        }

        const cantidad = updateDto.cantidad || detalle.cantidad;
        if (inventario.cantidad < cantidad) {
          throw new BadRequestException(`No hay suficiente stock disponible. Stock actual: ${inventario.cantidad}`);
        }

        detalle.parte = parteActualizada;
        detalle.parteId = parteActualizada.id;
      }
    }

    // Manejo de cambio de cantidad
    if (updateDto.cantidad !== undefined) {
      // Validar inventario si no cambió el repuesto
      if (!parteActualizada) {
        const parteIdActual = detalle.parteId;
        const inventario = await this.inventarioRepository.findOne({
          where: { parteId: parteIdActual, deletedAt: null }
        });

        if (!inventario) {
          throw new NotFoundException(`Inventario para parte ID ${parteIdActual} no encontrado`);
        }

        if (inventario.cantidad < updateDto.cantidad) {
          throw new BadRequestException(`No hay suficiente stock disponible. Stock actual: ${inventario.cantidad}`);
        }
      }

      detalle.cantidad = updateDto.cantidad;
    }

    // Actualizar precios
    if (parteActualizada || updateDto.cantidad !== undefined) {
      const partePrecio = parteActualizada ?? detalle.parte;
      const precioUnitario = Number(partePrecio?.precioReferencia ?? 0);
      detalle.precioUnitario = precioUnitario;
      detalle.subtotal = precioUnitario * detalle.cantidad;
    }

    // Actualizar otros campos
    if (updateDto.comentario !== undefined) {
      detalle.comentario = updateDto.comentario;
    }

    if (updateDto.estado !== undefined) {
      detalle.estado = updateDto.estado;
    }

    if (updateDto.presupuestoId !== undefined) {
      detalle.presupuestoId = updateDto.presupuestoId;
    }

    // Guardar cambios
    const detalleActualizado = await this.detalleRepository.save(detalle);
    return this.findOne(detalleActualizado.id, true);
  }

  async remove(id: number): Promise<{ message: string }> {
    const detalle = await this.findOne(id);
    await this.detalleRepository.softRemove(detalle);
    detalle.estado = false;
    await this.detalleRepository.save(detalle);
    return { message: `DetallePresupuestoItem con ID ${id} deshabilitado (soft delete).` };
  }

  async restore(id: number): Promise<{ message: string }> {
    const detalle = await this.findOne(id, true);

    if (!detalle.deletedAt) {
      throw new BadRequestException('El detalle no está eliminado');
    }

    await this.detalleRepository.restore(id);
    detalle.estado = true;
    await this.detalleRepository.save(detalle);

    return { message: `DetallePresupuestoItem con ID ${id} restaurado.` };
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

    query.skip(skip)
      .take(limit)
      .orderBy('detalle.createdAt', 'DESC');

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
