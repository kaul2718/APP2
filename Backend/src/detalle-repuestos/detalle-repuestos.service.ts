import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { DetalleRepuestos } from './entities/detalle-repuesto.entity';
import { CreateDetalleRepuestoDto } from './dto/create-detalle-repuesto.dto';
import { UpdateDetalleRepuestoDto } from './dto/update-detalle-repuesto.dto';
import { Repuesto } from '../repuestos/entities/repuesto.entity';
import { Presupuesto } from '../presupuesto/entities/presupuesto.entity';
import { Inventario } from '../inventario/entities/inventario.entity';

@Injectable()
export class DetalleRepuestosService {
  constructor(
    @InjectRepository(DetalleRepuestos)
    private readonly detalleRepository: Repository<DetalleRepuestos>,
    @InjectRepository(Repuesto)
    private readonly repuestoRepository: Repository<Repuesto>,
    @InjectRepository(Presupuesto)
    private readonly presupuestoRepository: Repository<Presupuesto>,
    @InjectRepository(Inventario)
    private readonly inventarioRepository: Repository<Inventario>,
  ) { }

  async create(createDto: CreateDetalleRepuestoDto): Promise<DetalleRepuestos> {
    const { repuestoId, cantidad, presupuestoId } = createDto;

    const repuesto = await this.repuestoRepository.findOne({
      where: { id: repuestoId },
      withDeleted: true,
    });
    if (!repuesto) {
      throw new NotFoundException(`Repuesto con ID ${repuestoId} no encontrado`);
    }

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
        parteId: repuesto.parteId,
        deletedAt: null,
      },
    });

    if (!inventario) {
      throw new NotFoundException(`Inventario para parte ID ${repuesto.parteId} no encontrado`);
    }

    if (inventario.cantidad < cantidad) {
      throw new BadRequestException(`No hay suficiente stock disponible. Stock actual: ${inventario.cantidad}`);
    }

    const precioUnitario = repuesto.precioVenta;
    const subtotal = precioUnitario * cantidad;

    const detalle = this.detalleRepository.create({
      cantidad,
      precioUnitario,
      subtotal,
      fechaUso: new Date(),
      presupuestoId,
      repuestoId,
      comentario: createDto.comentario ?? null,
      estado: true,
    });

    return await this.detalleRepository.save(detalle);
  }

  async findAll(includeInactive = false): Promise<DetalleRepuestos[]> {
    return this.detalleRepository.find({
      where: includeInactive ? {} : { estado: true },
      withDeleted: includeInactive,
      relations: ['repuesto', 'repuesto.parte', 'presupuesto'],
    });
  }

  async findOne(id: number, includeInactive = false): Promise<DetalleRepuestos> {
    const detalle = await this.detalleRepository.findOne({
      where: { id },
      withDeleted: includeInactive,
      relations: ['repuesto', 'repuesto.parte', 'presupuesto'],
    });

    if (!detalle || (!includeInactive && !detalle.estado)) {
      throw new NotFoundException(`DetalleRepuesto con ID ${id} no encontrado`);
    }

    return detalle;
  }

  async update(id: number, updateDto: UpdateDetalleRepuestoDto): Promise<DetalleRepuestos> {
    // Obtener el detalle existente incluyendo relaciones
    const detalle = await this.detalleRepository.findOne({
      where: { id },
      relations: ['repuesto', 'repuesto.parte', 'presupuesto'],
      withDeleted: true
    });

    if (!detalle) {
      throw new NotFoundException(`DetalleRepuesto con ID ${id} no encontrado`);
    }

    // Validación de cantidad
    if (updateDto.cantidad !== undefined && updateDto.cantidad <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor a 0');
    }

    // Manejo de cambio de repuesto
    let repuestoActualizado: Repuesto | null = null;
    if (updateDto.repuestoId !== undefined && updateDto.repuestoId !== detalle.repuestoId) {
      repuestoActualizado = await this.repuestoRepository.findOne({
        where: { id: updateDto.repuestoId },
        relations: ['parte']
      });

      if (!repuestoActualizado) {
        throw new NotFoundException(`Repuesto con ID ${updateDto.repuestoId} no encontrado`);
      }

      // Validar inventario para el nuevo repuesto
      const inventario = await this.inventarioRepository.findOne({
        where: { parteId: repuestoActualizado.parteId, deletedAt: null }
      });

      if (!inventario) {
        throw new NotFoundException(`Inventario para parte ID ${repuestoActualizado.parteId} no encontrado`);
      }

      const cantidad = updateDto.cantidad || detalle.cantidad;
      if (inventario.cantidad < cantidad) {
        throw new BadRequestException(`No hay suficiente stock disponible. Stock actual: ${inventario.cantidad}`);
      }

      detalle.repuesto = repuestoActualizado;
      detalle.repuestoId = repuestoActualizado.id;
    }

    // Manejo de cambio de cantidad
    if (updateDto.cantidad !== undefined) {
      // Validar inventario si no cambió el repuesto
      if (!repuestoActualizado) {
        const inventario = await this.inventarioRepository.findOne({
          where: { parteId: detalle.repuesto.parteId, deletedAt: null }
        });

        if (!inventario) {
          throw new NotFoundException(`Inventario para parte ID ${detalle.repuesto.parteId} no encontrado`);
        }

        if (inventario.cantidad < updateDto.cantidad) {
          throw new BadRequestException(`No hay suficiente stock disponible. Stock actual: ${inventario.cantidad}`);
        }
      }

      detalle.cantidad = updateDto.cantidad;
    }

    // Actualizar precios
    if (repuestoActualizado || updateDto.cantidad !== undefined) {
      const repuesto = repuestoActualizado || detalle.repuesto;
      detalle.precioUnitario = repuesto.precioVenta;
      detalle.subtotal = repuesto.precioVenta * detalle.cantidad;
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

    // Asegurar que las relaciones estén cargadas
    if (!detalleActualizado.repuesto) {
      detalleActualizado.repuesto = await this.repuestoRepository.findOne({
        where: { id: detalleActualizado.repuestoId },
        relations: ['parte']
      });
    }

    return detalleActualizado;
  }

  async remove(id: number): Promise<{ message: string }> {
    const detalle = await this.findOne(id);
    await this.detalleRepository.softRemove(detalle);
    detalle.estado = false;
    await this.detalleRepository.save(detalle);
    return { message: `DetalleRepuesto con ID ${id} deshabilitado (soft delete).` };
  }

  async restore(id: number): Promise<{ message: string }> {
    const detalle = await this.findOne(id, true);

    if (!detalle.deletedAt) {
      throw new BadRequestException('El detalle no está eliminado');
    }

    await this.detalleRepository.restore(id);
    detalle.estado = true;
    await this.detalleRepository.save(detalle);

    return { message: `DetalleRepuesto con ID ${id} restaurado.` };
  }

  async findAllPaginated(
    page: number,
    limit: number,
    search?: string,
    includeInactive = false,
  ): Promise<{ data: DetalleRepuestos[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = this.detalleRepository.createQueryBuilder('detalle')
      .leftJoinAndSelect('detalle.repuesto', 'repuesto')
      .leftJoinAndSelect('repuesto.parte', 'parte')
      .leftJoinAndSelect('detalle.presupuesto', 'presupuesto');

    if (search) {
      query.where('LOWER(parte.nombre) LIKE LOWER(:search)', {
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

  async toggleStatus(id: number): Promise<DetalleRepuestos> {
    const detalle = await this.findOne(id, true);
    detalle.estado = !detalle.estado;
    await this.detalleRepository.save(detalle);
    return detalle;
  }
}
