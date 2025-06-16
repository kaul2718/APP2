import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Presupuesto } from './entities/presupuesto.entity';
import { EstadoPresupuesto } from '../common/enums/estadoPresupuesto.enum';
import { CreatePresupuestoDto } from './dto/create-presupuesto.dto';
import { DetalleServicio } from '../detalle-servicios/entities/detalle-servicio.entity';
import { DetalleRepuestos } from '../detalle-repuestos/entities/detalle-repuesto.entity';

@Injectable()
export class PresupuestoService {
  constructor(
    @InjectRepository(Presupuesto)
    private readonly presupuestoRepository: Repository<Presupuesto>,
    @InjectRepository(DetalleServicio)
    private readonly detalleServicioRepository: Repository<DetalleServicio>,

    @InjectRepository(DetalleRepuestos)
    private readonly detalleRepuestoRepository: Repository<DetalleRepuestos>,
  ) { }

  async create(createPresupuestoDto: CreatePresupuestoDto): Promise<Presupuesto> {
    const { orderId, descripcion } = createPresupuestoDto;

    // Obtener los detalles de servicios y repuestos
    const detalleServicios = await this.detalleServicioRepository.find({
      where: { orderId },
    });

    const detalleRepuestos = await this.detalleRepuestoRepository.find({
      where: { orderId },
    });

    // Calcular costos usando el subtotal y asegurarse de que los valores son numéricos
    const costoManoObra = detalleServicios.reduce(
      (total, item) => total + (Number(item.subtotal) || 0), // Convierte a número
      0
    );

    const costoRepuesto = detalleRepuestos.reduce(
      (total, item) => total + (Number(item.subtotal) || 0), // Convierte a número
      0
    );

    const costoTotal = costoManoObra + costoRepuesto;

    // Crear el presupuesto
    const presupuesto = this.presupuestoRepository.create({
      fechaEmision: new Date(),
      costoManoObra,
      costoRepuesto,
      costoTotal,
      estado: EstadoPresupuesto.PENDIENTE,
      descripcion,
      orderId,
    });

    return this.presupuestoRepository.save(presupuesto);
  }

  // Obtener un presupuesto por ID
  async getPresupuesto(id: number): Promise<Presupuesto> {
    if (isNaN(id)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }

    const presupuesto = await this.presupuestoRepository.findOne({ where: { id } });
    if (!presupuesto) {
      throw new NotFoundException(`Presupuesto con ID ${id} no encontrado.`);
    }

    return presupuesto;
  }

  // Aceptar un presupuesto
  async aceptarPresupuesto(id: number): Promise<Presupuesto> {
    const presupuesto = await this.presupuestoRepository.findOne({ where: { id } });
    if (!presupuesto) {
      throw new NotFoundException('Presupuesto no encontrado');
    }

    if (presupuesto.estado !== EstadoPresupuesto.PENDIENTE) {
      throw new BadRequestException('Solo los presupuestos pendientes pueden ser aceptados');
    }

    presupuesto.estado = EstadoPresupuesto.ACEPTADO;
    presupuesto.fechaEstadoCambio = new Date(); // Se asume que esta propiedad está en la entidad Presupuesto

    try {
      return await this.presupuestoRepository.save(presupuesto);
    } catch (error) {
      throw new InternalServerErrorException(`Error al aceptar el presupuesto: ${error.message}`);
    }
  }

  // Rechazar un presupuesto
  async rechazarPresupuesto(id: number): Promise<Presupuesto> {
    const presupuesto = await this.presupuestoRepository.findOne({ where: { id } });
    if (!presupuesto) {
      throw new NotFoundException('Presupuesto no encontrado');
    }

    if (presupuesto.estado !== EstadoPresupuesto.PENDIENTE) {
      throw new BadRequestException('Solo los presupuestos pendientes pueden ser rechazados');
    }

    presupuesto.estado = EstadoPresupuesto.RECHAZADO;
    presupuesto.fechaEstadoCambio = new Date(); // Se asume que esta propiedad está en la entidad Presupuesto

    try {
      return await this.presupuestoRepository.save(presupuesto);
    } catch (error) {
      throw new InternalServerErrorException(`Error al rechazar el presupuesto: ${error.message}`);
    }
  }
}
