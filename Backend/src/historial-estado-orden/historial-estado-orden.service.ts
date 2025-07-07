import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistorialEstadoOrden } from './entities/historial-estado-orden.entity';
import { CreateHistorialEstadoOrdenDto } from './dto/create-historial-estado-orden.dto';
import { EstadoOrden } from '../estado-orden/entities/estado-orden.entity';
import { Order } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class HistorialEstadoOrdenService {
  constructor(
    @InjectRepository(HistorialEstadoOrden)
    private readonly historialRepository: Repository<HistorialEstadoOrden>,
    @InjectRepository(Order)
    private readonly ordenRepository: Repository<Order>,
    @InjectRepository(EstadoOrden)
    private readonly estadoOrdenRepository: Repository<EstadoOrden>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(dto: CreateHistorialEstadoOrdenDto): Promise<HistorialEstadoOrden> {
    const { ordenId, estadoOrdenId, usuarioId, observaciones } = dto;

    const orden = await this.ordenRepository.findOne({ where: { id: ordenId } });
    if (!orden) throw new NotFoundException(`Orden ${ordenId} no encontrada`);

    const estadoOrden = await this.estadoOrdenRepository.findOne({ where: { id: estadoOrdenId } });
    if (!estadoOrden) throw new NotFoundException(`Estado ${estadoOrdenId} no encontrado`);

    const usuario = await this.userRepository.findOne({ where: { id: usuarioId } });
    if (!usuario) throw new NotFoundException(`Usuario ${usuarioId} no encontrado`);

    const historial = this.historialRepository.create({
      orden,
      estadoOrden,
      usuario,
      observaciones,
      fechaCambio: new Date(),
    });

    return this.historialRepository.save(historial);
  }

  async findAll(): Promise<HistorialEstadoOrden[]> {
    return this.historialRepository.find({
      relations: ['orden', 'estadoOrden', 'usuario'],
      order: { fechaCambio: 'DESC' },
    });
  }

  async findByOrden(ordenId: number): Promise<HistorialEstadoOrden[]> {
    return this.historialRepository.find({
      where: { orden: { id: ordenId } },
      relations: ['estadoOrden', 'usuario'],
      order: { fechaCambio: 'DESC' },
    });
  }
}