import {BadRequestException,Injectable,NotFoundException,} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistorialEstadoOrden } from './entities/historial-estado-orden.entity';
import { CreateHistorialEstadoOrdenDto } from './dto/create-historial-estado-orden.dto';
import { EstadoOrden } from 'src/estado-orden/entities/estado-orden.entity';
import { Order } from 'src/orders/entities/order.entity';
import { User } from 'src/users/entities/user.entity';

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
    const { ordenId, estadoAnteriorId, estadoNuevoId, usuarioEstadoId, observaciones } = dto;

    const orden = await this.ordenRepository.findOne({ where: { id: ordenId } });
    if (!orden) throw new NotFoundException(`Orden ${ordenId} no encontrada`);

    const estadoAnterior = await this.estadoOrdenRepository.findOne({ where: { id: estadoAnteriorId } });
    if (!estadoAnterior) throw new NotFoundException(`Estado anterior ${estadoAnteriorId} no encontrado`);

    const estadoNuevo = await this.estadoOrdenRepository.findOne({ where: { id: estadoNuevoId } });
    if (!estadoNuevo) throw new NotFoundException(`Estado nuevo ${estadoNuevoId} no encontrado`);

    const usuario = await this.userRepository.findOne({ where: { id: usuarioEstadoId } });
    if (!usuario) throw new NotFoundException(`Usuario ${usuarioEstadoId} no encontrado`);

    // Crear el historial
    const historial = this.historialRepository.create({
      orden,
      estadoAnterior,
      estadoNuevo,
      usuarioEstado: usuario,
      observaciones,
      fechaCambio: new Date(),
    });

    return await this.historialRepository.save(historial);
  }

  async findAll(): Promise<HistorialEstadoOrden[]> {
    return this.historialRepository.find({
      relations: ['orden', 'estadoAnterior', 'estadoNuevo', 'usuarioEstado'],
      order: { fechaCambio: 'DESC' },
    });
  }

  async findByOrden(ordenId: number): Promise<HistorialEstadoOrden[]> {
    return this.historialRepository.find({
      where: { orden: { id: ordenId } },
      relations: ['estadoAnterior', 'estadoNuevo', 'usuarioEstado'],
      order: { fechaCambio: 'DESC' },
    });
  }
}
