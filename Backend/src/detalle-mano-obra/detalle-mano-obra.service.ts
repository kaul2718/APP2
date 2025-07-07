import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { DetalleManoObra } from './entities/detalle-mano-obra.entity';
import { CreateDetalleManoObraDto } from './dto/create-detalle-mano-obra.dto';
import { UpdateDetalleManoObraDto } from './dto/update-detalle-mano-obra.dto';
import { TipoManoObra } from '../tipo-mano-obra/entities/tipo-mano-obra.entity';
import { Presupuesto } from '../presupuesto/entities/presupuesto.entity';

@Injectable()
export class DetalleManoObraService {
  constructor(
    @InjectRepository(DetalleManoObra)
    private readonly detalleRepository: Repository<DetalleManoObra>,
    @InjectRepository(TipoManoObra)
    private readonly tipoRepository: Repository<TipoManoObra>,
    @InjectRepository(Presupuesto)
    private readonly presupuestoRepository: Repository<Presupuesto>,
  ) { }

  async create(createDto: CreateDetalleManoObraDto): Promise<DetalleManoObra> {
    const { presupuestoId, tipoManoObraId, cantidad } = createDto;

    // Verificar existencia del presupuesto
    const presupuesto = await this.presupuestoRepository.findOne({
      where: { id: presupuestoId },
      withDeleted: true,
    });
    if (!presupuesto) {
      throw new NotFoundException(`Presupuesto con ID ${presupuestoId} no encontrado`);
    }

    // Verificar existencia del tipo de mano de obra
    const tipo = await this.tipoRepository.findOne({
      where: { id: tipoManoObraId },
      withDeleted: true,
    });
    if (!tipo) {
      throw new NotFoundException(`TipoManoObra con ID ${tipoManoObraId} no encontrado`);
    }

    if (cantidad <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor a 0');
    }

    const costoUnitario = tipo.costo;
    const costoTotal = costoUnitario * cantidad;

    const detalle = this.detalleRepository.create({
      presupuestoId,
      tipoManoObraId,
      cantidad,
      costoUnitario,
      costoTotal,
      estado: true, // Por defecto activo
    });

    return await this.detalleRepository.save(detalle);
  }

  async findAll(includeInactive = false): Promise<DetalleManoObra[]> {
    return this.detalleRepository.find({
      where: includeInactive ? {} : { estado: true },
      withDeleted: includeInactive,
      relations: ['tipoManoObra', 'presupuesto'],
    });
  }

  async findOne(id: number, includeInactive = false): Promise<DetalleManoObra> {
    const detalle = await this.detalleRepository.findOne({
      where: { id },
      withDeleted: includeInactive,
      relations: ['tipoManoObra', 'presupuesto'],
    });

    if (!detalle || (!includeInactive && !detalle.estado)) {
      throw new NotFoundException(`DetalleManoObra con ID ${id} no encontrado`);
    }

    return detalle;
  }

  async update(id: number, updateDto: UpdateDetalleManoObraDto): Promise<DetalleManoObra> {
    // Obtener el detalle existente incluyendo relaciones
    const detalle = await this.detalleRepository.findOne({
      where: { id },
      relations: ['tipoManoObra', 'presupuesto'],
      withDeleted: true
    });

    if (!detalle) {
      throw new NotFoundException(`DetalleManoObra con ID ${id} no encontrado`);
    }

    // Validación de cantidad
    if (updateDto.cantidad !== undefined && updateDto.cantidad <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor a 0');
    }

    // Manejo de cambio de tipo de mano de obra
    let tipoActualizado: TipoManoObra | null = null;
    if (updateDto.tipoManoObraId !== undefined && updateDto.tipoManoObraId !== detalle.tipoManoObraId) {
      tipoActualizado = await this.tipoRepository.findOne({
        where: { id: updateDto.tipoManoObraId }
      });

      if (!tipoActualizado) {
        throw new NotFoundException(`TipoManoObra con ID ${updateDto.tipoManoObraId} no encontrado`);
      }

      detalle.tipoManoObra = tipoActualizado;
      detalle.tipoManoObraId = tipoActualizado.id;
    }

    // Manejo de cambio de cantidad
    if (updateDto.cantidad !== undefined) {
      detalle.cantidad = updateDto.cantidad;
    }

    // Recalcular costos si cambia cantidad o tipo
    if (tipoActualizado || updateDto.cantidad !== undefined) {
      const tipo = tipoActualizado || detalle.tipoManoObra;
      detalle.costoUnitario = tipo.costo;
      detalle.costoTotal = tipo.costo * detalle.cantidad;
    }

    // Actualizar otros campos
    if (updateDto.estado !== undefined) {
      detalle.estado = updateDto.estado;
    }

    if (updateDto.presupuestoId !== undefined) {
      detalle.presupuestoId = updateDto.presupuestoId;
    }

    // Guardar cambios
    const detalleActualizado = await this.detalleRepository.save(detalle);

    // Asegurar que las relaciones estén cargadas
    if (!detalleActualizado.tipoManoObra) {
      detalleActualizado.tipoManoObra = await this.tipoRepository.findOne({
        where: { id: detalleActualizado.tipoManoObraId }
      });
    }

    return detalleActualizado;
  }
  
  async remove(id: number): Promise<{ message: string }> {
    const detalle = await this.findOne(id);

    // Soft delete
    await this.detalleRepository.softRemove(detalle);

    // Marcamos como inactivo
    detalle.estado = false;
    await this.detalleRepository.save(detalle);

    return { message: `DetalleManoObra con ID ${id} deshabilitado (soft delete).` };
  }

  async restore(id: number): Promise<{ message: string }> {
    const detalle = await this.findOne(id, true);

    if (!detalle.deletedAt) {
      throw new BadRequestException('El detalle no está eliminado');
    }

    // Restauramos el soft delete
    await this.detalleRepository.restore(id);

    // Lo marcamos como activo
    detalle.estado = true;
    await this.detalleRepository.save(detalle);

    return { message: `DetalleManoObra con ID ${id} restaurado.` };
  }

  async findAllPaginated(
    page: number,
    limit: number,
    search?: string,
    includeInactive = false,
  ): Promise<{ data: DetalleManoObra[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = this.detalleRepository.createQueryBuilder('detalle')
      .leftJoinAndSelect('detalle.tipoManoObra', 'tipoManoObra')
      .leftJoinAndSelect('detalle.presupuesto', 'presupuesto');

    if (search) {
      query.where('LOWER(tipoManoObra.nombre) LIKE LOWER(:search)', {
        search: `%${search}%`
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

  async toggleStatus(id: number): Promise<DetalleManoObra> {
    const detalle = await this.findOne(id, true);

    detalle.estado = !detalle.estado;
    await this.detalleRepository.save(detalle);

    return detalle;
  }
}