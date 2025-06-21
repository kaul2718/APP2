import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DetalleRepuestos } from './entities/detalle-repuesto.entity';
import { CreateDetalleRepuestoDto } from './dto/create-detalle-repuesto.dto';
import { UpdateDetalleRepuestoDto } from './dto/update-detalle-repuesto.dto';
import { Repuesto } from '../repuestos/entities/repuesto.entity';
import { Inventario } from '../inventario/entities/inventario.entity';
import { EstadoDetalleRepuesto } from 'src/common/enums/estadoDetalleRepuesto';

@Injectable()
export class DetalleRepuestosService {
  constructor(
    @InjectRepository(DetalleRepuestos)
    private readonly detalleRepuestosRepository: Repository<DetalleRepuestos>,

    @InjectRepository(Repuesto)
    private readonly repuestoRepository: Repository<Repuesto>,

    @InjectRepository(Inventario)
    private readonly inventarioRepository: Repository<Inventario>,
  ) {}

  // Crear detalle (no toca inventario)
  async create(createDto: CreateDetalleRepuestoDto): Promise<DetalleRepuestos> {
    const { repuestoId, cantidad, orderId } = createDto;

    const repuesto = await this.repuestoRepository.findOne({
      where: { id: repuestoId, isDeleted: false },
    });
    if (!repuesto) throw new NotFoundException(`Repuesto con ID ${repuestoId} no encontrado.`);

    const inventario = await this.inventarioRepository.findOne({
      where: { parteId: repuesto.parteId, isDeleted: false },
    });
    if (!inventario) throw new NotFoundException(`Inventario para parte ID ${repuesto.parteId} no encontrado.`);

    if (inventario.cantidad < cantidad)
      throw new BadRequestException(`No hay suficiente stock disponible.`);

    const precioUnitario = repuesto.precioVenta;
    const subtotal = precioUnitario * cantidad;

    const detalle = this.detalleRepuestosRepository.create({
      cantidad,
      precioUnitario,
      subtotal,
      fechaUso: new Date(),
      orderId,
      repuestoId,
      estado: EstadoDetalleRepuesto.ACTIVO,
      comentario: createDto.comentario ?? null,
    });

    return await this.detalleRepuestosRepository.save(detalle);
  }

  async findAll(): Promise<DetalleRepuestos[]> {
    try {
      return await this.detalleRepuestosRepository.find({
        where: { estado: EstadoDetalleRepuesto.ACTIVO },
        relations: ['repuesto', 'repuesto.parte'],
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Error al obtener los detalles de repuestos: ${error.message}`,
      );
    }
  }

  async findOne(id: number): Promise<DetalleRepuestos> {
    const detalle = await this.detalleRepuestosRepository.findOne({
      where: { id },
      relations: ['repuesto', 'repuesto.parte'],
    });
    if (!detalle) {
      throw new NotFoundException(`Detalle de repuesto con ID ${id} no encontrado.`);
    }
    return detalle;
  }

  // Actualiza solo los campos (no toca inventario)
  async update(id: number, updateDto: UpdateDetalleRepuestoDto): Promise<DetalleRepuestos> {
    const detalle = await this.detalleRepuestosRepository.findOne({
      where: { id },
      relations: ['repuesto'],
    });
    if (!detalle) throw new NotFoundException(`Detalle con ID ${id} no encontrado.`);

    const repuesto = detalle.repuesto;
    const inventario = await this.inventarioRepository.findOne({
      where: { parteId: repuesto.parteId, isDeleted: false },
    });
    if (!inventario) throw new NotFoundException(`Inventario para parte ID ${repuesto.parteId} no encontrado.`);

    const nuevaCantidad = updateDto.cantidad ?? detalle.cantidad;
    const diferencia = nuevaCantidad - detalle.cantidad;

    if (inventario.cantidad < diferencia)
      throw new BadRequestException(`No hay suficiente stock disponible para actualizar.`);

    detalle.cantidad = nuevaCantidad;
    detalle.precioUnitario = repuesto.precioVenta;
    detalle.subtotal = repuesto.precioVenta * nuevaCantidad;
    detalle.estado = updateDto.estado ?? detalle.estado;
    detalle.comentario = updateDto.comentario ?? detalle.comentario;

    return await this.detalleRepuestosRepository.save(detalle);
  }

  // Marca como anulado (sin tocar inventario aún)
  async remove(id: number): Promise<{ message: string }> {
    const detalle = await this.detalleRepuestosRepository.findOne({
      where: { id },
      relations: ['repuesto', 'repuesto.parte'],
    });
    if (!detalle) {
      throw new NotFoundException(`Detalle de repuesto con ID ${id} no encontrado.`);
    }

    detalle.estado = EstadoDetalleRepuesto.ANULADO;
    detalle.comentario = 'Detalle anulado por el sistema o usuario';

    await this.detalleRepuestosRepository.save(detalle);

    return { message: `Detalle de repuesto con ID ${id} anulado con éxito.` };
  }
}