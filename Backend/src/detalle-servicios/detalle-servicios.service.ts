import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DetalleServicio } from './entities/detalle-servicio.entity';
import { CreateDetalleServicioDto } from './dto/create-detalle-servicio.dto';
import { UpdateDetalleServicioDto } from './dto/update-detalle-servicio.dto';
import { Order } from 'src/orders/entities/order.entity';
import { Servicio } from 'src/servicios/entities/servicio.entity';

@Injectable()
export class DetalleServiciosService {
  constructor(
    @InjectRepository(DetalleServicio)
    private readonly detalleServiciosRepository: Repository<DetalleServicio>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Servicio)
    private readonly servicioRepository: Repository<Servicio>,
  ) {}

  // Crear un nuevo detalle de servicio
  async create(createDetalleServicioDto: CreateDetalleServicioDto): Promise<DetalleServicio> {
    const { orderId, servicioId, cantidad } = createDetalleServicioDto;

    // Verificar si la orden y servicio existen
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    const servicio = await this.servicioRepository.findOne({ where: { id: servicioId } });

    if (!order) {
      throw new NotFoundException(`Orden con ID ${orderId} no encontrada.`);
    }

    if (!servicio) {
      throw new NotFoundException(`Servicio con ID ${servicioId} no encontrado.`);
    }

    try {
      // Crear el detalle de servicio
      const detalleServicio = this.detalleServiciosRepository.create(createDetalleServicioDto);
      return await this.detalleServiciosRepository.save(detalleServicio);
    } catch (error) {
      throw new InternalServerErrorException(`Error al crear el detalle de servicio: ${error.message}`);
    }
  }

  // Obtener todos los detalles de servicio
  async findAll(): Promise<DetalleServicio[]> {
    try {
      return await this.detalleServiciosRepository.find({ relations: ['order', 'servicio'] });
    } catch (error) {
      throw new InternalServerErrorException(`Error al obtener los detalles de servicio: ${error.message}`);
    }
  }

  // Obtener un detalle de servicio por ID
  async findOne(id: number): Promise<DetalleServicio> {
    try {
      const detalleServicio = await this.detalleServiciosRepository.findOne({
        where: { id },
        relations: ['order', 'servicio'],
      });
      if (!detalleServicio) {
        throw new NotFoundException(`Detalle de servicio con ID ${id} no encontrado.`);
      }
      return detalleServicio;
    } catch (error) {
      throw new InternalServerErrorException(`Error al obtener el detalle de servicio: ${error.message}`);
    }
  }

  // Actualizar un detalle de servicio
  async update(id: number, updateDetalleServicioDto: UpdateDetalleServicioDto): Promise<DetalleServicio> {
    try {
      const detalleServicio = await this.detalleServiciosRepository.findOne({ where: { id } });

      if (!detalleServicio) {
        throw new NotFoundException(`Detalle de servicio con ID ${id} no encontrado.`);
      }

      // Actualizar el detalle de servicio
      Object.assign(detalleServicio, updateDetalleServicioDto);
      return await this.detalleServiciosRepository.save(detalleServicio);
    } catch (error) {
      throw new InternalServerErrorException(`Error al actualizar el detalle de servicio: ${error.message}`);
    }
  }

  // Eliminar un detalle de servicio
  async remove(id: number): Promise<{ message: string }> {
    try {
      const detalleServicio = await this.detalleServiciosRepository.findOne({ where: { id } });

      if (!detalleServicio) {
        throw new NotFoundException(`Detalle de servicio con ID ${id} no encontrado.`);
      }

      await this.detalleServiciosRepository.remove(detalleServicio);

      return { message: `Detalle de servicio con ID ${id} eliminado con éxito.` };
    } catch (error) {
      throw new InternalServerErrorException(`Error al eliminar el detalle de servicio: ${error.message}`);
    }
  }
}
