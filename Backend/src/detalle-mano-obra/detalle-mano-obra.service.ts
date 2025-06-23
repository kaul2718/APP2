import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DetalleManoObra } from './entities/detalle-mano-obra.entity';
import { CreateDetalleManoObraDto } from './dto/create-detalle-mano-obra.dto';
import { UpdateDetalleManoObraDto } from './dto/update-detalle-mano-obra.dto';
import { TipoManoObra } from 'src/tipo-mano-obra/entities/tipo-mano-obra.entity';
import { Presupuesto } from 'src/presupuesto/entities/presupuesto.entity';

@Injectable()
export class DetalleManoObraService {
  constructor(
    @InjectRepository(DetalleManoObra)
    private readonly detalleRepository: Repository<DetalleManoObra>,

    @InjectRepository(TipoManoObra)
    private readonly tipoRepository: Repository<TipoManoObra>,

    @InjectRepository(Presupuesto)
    private readonly presupuestoRepository: Repository<Presupuesto>,
  ) {}

  async create(dto: CreateDetalleManoObraDto): Promise<DetalleManoObra> {
    const { presupuestoId, tipoManoObraId, cantidad } = dto;

    // Verificar existencia del presupuesto
    const presupuesto = await this.presupuestoRepository.findOne({ where: { id: presupuestoId } });
    if (!presupuesto) {
      throw new NotFoundException(`Presupuesto con ID ${presupuestoId} no encontrado`);
    }

    // Verificar existencia del tipo de mano de obra
    const tipo = await this.tipoRepository.findOne({ where: { id: tipoManoObraId } });
    if (!tipo) {
      throw new NotFoundException(`TipoManoObra con ID ${tipoManoObraId} no encontrado`);
    }

    if (cantidad <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor a 0');
    }

    const costoUnitario = tipo.costo; // ya viene de la entidad TipoManoObra
    const costoTotal = costoUnitario * cantidad;

    const detalle = this.detalleRepository.create({
      presupuestoId,
      tipoManoObraId,
      cantidad,
      costoUnitario,
      costoTotal,
    });

    return await this.detalleRepository.save(detalle);
  }

  async findAll(): Promise<DetalleManoObra[]> {
    return this.detalleRepository.find({
      relations: ['tipoManoObra', 'presupuesto'],
    });
  }

  async findOne(id: number): Promise<DetalleManoObra> {
    const detalle = await this.detalleRepository.findOne({
      where: { id },
      relations: ['tipoManoObra', 'presupuesto'],
    });

    if (!detalle) throw new NotFoundException(`DetalleManoObra con ID ${id} no encontrado`);
    return detalle;
  }

  async update(id: number, dto: UpdateDetalleManoObraDto): Promise<DetalleManoObra> {
    const detalle = await this.findOne(id);

    if (dto.cantidad !== undefined && dto.cantidad <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor a 0');
    }

    Object.assign(detalle, dto);

    // Recalcular total si cambia cantidad
    if (dto.cantidad !== undefined || dto.tipoManoObraId !== undefined) {
      const tipo = await this.tipoRepository.findOne({
        where: { id: dto.tipoManoObraId ?? detalle.tipoManoObraId },
      });

      if (!tipo) throw new NotFoundException('TipoManoObra no encontrado');

      detalle.costoUnitario = tipo.costo;
      detalle.costoTotal = tipo.costo * (dto.cantidad ?? detalle.cantidad);
    }

    return await this.detalleRepository.save(detalle);
  }

  async remove(id: number): Promise<{ message: string }> {
    const detalle = await this.findOne(id);
    await this.detalleRepository.remove(detalle);
    return { message: `DetalleManoObra con ID ${id} eliminado correctamente.` };
  }
}
