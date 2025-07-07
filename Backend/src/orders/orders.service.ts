import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, Not, IsNull } from 'typeorm';
import { Order } from './entities/order.entity';
import { User } from '../users/entities/user.entity';
import { Equipo } from 'src/equipo/entities/equipo.entity';
import { EstadoOrden } from 'src/estado-orden/entities/estado-orden.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ActividadTecnica } from 'src/actividad-tecnica/entities/actividad-tecnica.entity';
import { Presupuesto } from 'src/presupuesto/entities/presupuesto.entity';
import { DetalleRepuestos } from 'src/detalle-repuestos/entities/detalle-repuesto.entity';
import { Casillero } from 'src/casillero/entities/casillero.entity';
import { EvidenciaTecnica } from 'src/evidencia-tecnica/entities/evidencia-tecnica.entity';
import { HistorialEstadoOrden } from 'src/historial-estado-orden/entities/historial-estado-orden.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Equipo)
    private readonly equipoRepository: Repository<Equipo>,
    @InjectRepository(EstadoOrden)
    private readonly estadoOrdenRepository: Repository<EstadoOrden>,
    @InjectRepository(ActividadTecnica)
    private readonly actividadTecnicaRepository: Repository<ActividadTecnica>,
    @InjectRepository(Presupuesto)
    private readonly presupuestoRepository: Repository<Presupuesto>,
    @InjectRepository(DetalleRepuestos)
    private readonly detalleRepuestosRepository: Repository<DetalleRepuestos>,
    @InjectRepository(Casillero)
    private readonly casilleroRepository: Repository<Casillero>,
    @InjectRepository(EvidenciaTecnica)
    private readonly evidenciaTecnicaRepository: Repository<EvidenciaTecnica>,
    @InjectRepository(HistorialEstadoOrden)
    private readonly historialEstadoOrdenRepository: Repository<HistorialEstadoOrden>,
  ) { }

  async create(createDto: CreateOrderDto): Promise<Order> {
    // Validación de datos requeridos
    if (!createDto.clientId || !createDto.equipoId || !createDto.problemaReportado) {
      throw new BadRequestException('Datos incompletos para crear la orden');
    }

    // Generar número de orden (versión corregida)
    const workOrderNumber = await this.generateOrderNumber();

    // Obtener relaciones con manejo de errores mejorado
    const [client, equipo] = await Promise.all([
      this.validateUser(createDto.clientId, 'Cliente'),
      this.validateEquipo(createDto.equipoId)
    ]);

    const technician = createDto.technicianId
      ? await this.validateUser(createDto.technicianId, 'Técnico')
      : null;

    const recepcionista = createDto.recepcionistaId
      ? await this.validateUser(createDto.recepcionistaId, 'Recepcionista')
      : null;

    const estadoOrden = createDto.estadoOrdenId
      ? await this.estadoOrdenRepository.findOneBy({ id: createDto.estadoOrdenId })
      : await this.estadoOrdenRepository.findOneBy({ nombre: 'Ingresado / Recepcionado' });

    if (!estadoOrden) {
      throw new Error('No se pudo determinar el estado de la orden');
    }

    // Crear y guardar la orden
    const nuevaOrden = this.orderRepository.create({
      workOrderNumber,
      estado: true,
      client,
      equipo,
      technician,
      recepcionista,
      problemaReportado: createDto.problemaReportado,
      accesorios: createDto.accesorios || [],
      fechaPrometidaEntrega: createDto.fechaPrometidaEntrega || null,
      estadoOrden
    });

    const ordenGuardada = await this.orderRepository.save(nuevaOrden);

    // Crear historial
    await this.createHistorial(ordenGuardada, estadoOrden, recepcionista || technician || client);

    return ordenGuardada;
  }

  // Métodos auxiliares corregidos
  private async generateOrderNumber(): Promise<string> {
    try {
      // Obtener la última orden
      const ultimaOrden = await this.orderRepository.createQueryBuilder("order")
        .select("order.workOrderNumber")
        .orderBy("order.id", "DESC")
        .withDeleted()
        .getOne();

      // Si no hay órdenes previas, comenzar con 1
      if (!ultimaOrden || !ultimaOrden.workOrderNumber) {
        return '00001';
      }

      // Extraer solo los dígitos numéricos (por si hay prefijos)
      const soloNumeros = ultimaOrden.workOrderNumber.replace(/\D/g, '');

      // Convertir a número y sumar 1
      const siguienteNumero = parseInt(soloNumeros) + 1;

      // Formatear a 5 dígitos con ceros a la izquierda
      return siguienteNumero.toString().padStart(5, '0');

    } catch (error) {
      console.error('Error generando número de orden:', error);
      // Fallback: número aleatorio de 5 dígitos
      return Math.floor(10000 + Math.random() * 90000).toString();
    }
  }

  private async validateUser(id: number, role: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException(`${role} con ID ${id} no encontrado`);
    }

    return user;
  }

  private async validateEquipo(id: number): Promise<Equipo> {
    const equipo = await this.equipoRepository.findOne({
      where: { id },
      relations: ['tipoEquipo', 'marca', 'modelo']
    });

    if (!equipo) {
      throw new NotFoundException(`Equipo con ID ${id} no encontrado`);
    }

    return equipo;
  }

  private async validateEstadoOrden(id: number): Promise<EstadoOrden> {
    const estado = await this.estadoOrdenRepository.findOne({ where: { id } });
    if (!estado) {
      throw new NotFoundException(`Estado de orden con ID ${id} no encontrado`);
    }
    return estado;
  }

  private async getDefaultEstadoOrden(): Promise<EstadoOrden> {
    return this.estadoOrdenRepository.findOne({
      where: { nombre: 'Pendiente' } // O el estado por defecto que uses
    }) || this.estadoOrdenRepository.findOne({ order: { id: 'ASC' } });
  }

  private async createHistorial(
    orden: Order,
    estado: EstadoOrden,
    usuario: User
  ): Promise<void> {
    const historial = new HistorialEstadoOrden(orden, estado, usuario);
    await this.historialEstadoOrdenRepository.save(historial);
  }

  async findAll(includeInactive = false): Promise<Order[]> {
    return this.orderRepository.find({
      where: includeInactive ? {} : { estado: true },
      withDeleted: includeInactive,
      relations: [
        'client',
        'technician',
        'recepcionista',
        'equipo',
        'actividades',
        'presupuesto',
        'detallesRepuestos',
        'casillero',
        'evidencias',
        'estadoOrden',
        'historialEstados',
      ],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: number, includeInactive = false): Promise<Order> {
    const orden = await this.orderRepository.findOne({
      where: { id },
      withDeleted: includeInactive,
      relations: [
        'client',
        'technician',
        'recepcionista',
        'equipo',
        'actividades',
        'presupuesto',
        'detallesRepuestos',
        'casillero',
        'evidencias',
        'estadoOrden',
        'historialEstados',
      ],
    });

    if (!orden || (!includeInactive && !orden.estado)) {
      throw new NotFoundException('Orden no encontrada');
    }

    return orden;
  }

  async update(id: number, updateDto: UpdateOrderDto): Promise<Order> {
    const orden = await this.findOne(id, true);

    // Registrar cambios importantes en el historial
    const cambiosHistorial: string[] = [];

    if (updateDto.clientId && updateDto.clientId !== orden.client.id) {
      const client = await this.validateUser(updateDto.clientId, 'Cliente');
      orden.client = client;
      cambiosHistorial.push(`Cliente cambiado a ${client.nombre}`);
    }

    if (updateDto.equipoId && updateDto.equipoId !== orden.equipo.id) {
      const equipo = await this.validateEquipo(updateDto.equipoId);
      orden.equipo = equipo;
      cambiosHistorial.push(`Equipo cambiado a ${equipo.numeroSerie}`);
    }

    if (updateDto.technicianId !== undefined) {
      const oldTech = orden.technician?.nombre;

      if (updateDto.technicianId === null) {
        orden.technician = null;
        cambiosHistorial.push('Técnico removido');
      } else {
        const technician = await this.validateUser(updateDto.technicianId, 'Técnico');
        orden.technician = technician;

        if (!oldTech || technician.id !== orden.technician?.id) {
          cambiosHistorial.push(`Técnico cambiado a ${technician.nombre}`);
        }
      }
    }

    if (updateDto.estadoOrdenId !== undefined &&
      updateDto.estadoOrdenId !== orden.estadoOrden?.id) {
      const estadoOrden = updateDto.estadoOrdenId
        ? await this.validateEstadoOrden(updateDto.estadoOrdenId)
        : await this.getDefaultEstadoOrden();

      const historial = new HistorialEstadoOrden();
      historial.orden = orden;
      historial.estadoOrden = estadoOrden;
      historial.fechaCambio = new Date();
      historial.observaciones = 'Estado cambiado desde actualización';

      await this.historialEstadoOrdenRepository.save(historial);
      orden.estadoOrden = estadoOrden;
    }

    // Validar y actualizar campos simples
    if (updateDto.problemaReportado !== undefined) {
      orden.problemaReportado = updateDto.problemaReportado;
    }

    if (updateDto.fechaPrometidaEntrega !== undefined) {
      orden.fechaPrometidaEntrega = updateDto.fechaPrometidaEntrega;
    }

    const ordenActualizada = await this.orderRepository.save(orden);

    // Registrar otros cambios en el historial si hay
    if (cambiosHistorial.length > 0) {
      const historial = new HistorialEstadoOrden();
      historial.orden = orden;
      historial.estadoOrden = orden.estadoOrden;
      historial.fechaCambio = new Date();
      historial.observaciones = cambiosHistorial.join(', ');

      await this.historialEstadoOrdenRepository.save(historial);
    }

    return ordenActualizada;
  }

  async remove(id: number): Promise<{ message: string }> {
    const orden = await this.findOne(id);

    // Soft delete con TypeORM
    await this.orderRepository.softRemove(orden);

    // Además marcamos como inactivo
    orden.estado = false;
    await this.orderRepository.save(orden);

    return { message: `Orden con ID ${id} deshabilitada (soft delete).` };
  }

  async restore(id: number): Promise<{ message: string }> {
    const orden = await this.findOne(id, true);

    if (!orden.deletedAt) {
      throw new BadRequestException('La orden no está eliminada');
    }

    // Restauramos el soft delete
    await this.orderRepository.restore(id);

    // Lo marcamos como activo
    orden.estado = true;
    await this.orderRepository.save(orden);

    return { message: `Orden con ID ${id} restaurada.` };
  }

  async findAllPaginated(
    page: number,
    limit: number,
    search?: string,
    estadoOrdenId?: number,
    technicianId?: number,
    clientId?: number,
    fechaInicio?: Date,
    fechaFin?: Date,
    includeInactive = false,
  ): Promise<{ data: Order[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = this.orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.client', 'client')
      .leftJoinAndSelect('order.technician', 'technician')
      .leftJoinAndSelect('order.recepcionista', 'recepcionista')
      .leftJoinAndSelect('order.equipo', 'equipo')
      .leftJoinAndSelect('order.estadoOrden', 'estadoOrden')
      .orderBy('order.createdAt', 'DESC');

    // Manejo de la búsqueda corregido
    if (search) {
      query.where(
        '(order.workOrderNumber ILIKE :search OR ' +
        'client.nombre ILIKE :search OR ' +
        'equipo.numeroSerie ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Filtros adicionales
    if (estadoOrdenId) {
      query.andWhere('order.estadoOrdenId = :estadoOrdenId', { estadoOrdenId });
    }

    if (technicianId) {
      query.andWhere('order.technicianId = :technicianId', { technicianId });
    }

    if (clientId) {
      query.andWhere('order.clientId = :clientId', { clientId });
    }

    if (fechaInicio && fechaFin) {
      query.andWhere('order.createdAt BETWEEN :fechaInicio AND :fechaFin', {
        fechaInicio,
        fechaFin
      });
    }

    // Manejo de inactivos
    if (!includeInactive) {
      query.andWhere('order.estado = :estado', { estado: true })
        .andWhere('order.deletedAt IS NULL');
    }

    // Paginación
    const [data, total] = await query
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async toggleStatus(id: number): Promise<Order> {
    const orden = await this.findOne(id, true);

    orden.estado = !orden.estado;
    await this.orderRepository.save(orden);

    return orden;
  }

  async addActividadTecnica(orderId: number, actividadData: Partial<ActividadTecnica>): Promise<ActividadTecnica> {
    const orden = await this.findOne(orderId);

    const actividad = this.actividadTecnicaRepository.create({
      ...actividadData,
      orden,
    });

    return this.actividadTecnicaRepository.save(actividad);
  }

  async addPresupuesto(orderId: number, presupuestoData: Partial<Presupuesto>): Promise<Presupuesto> {
    const orden = await this.findOne(orderId);

    // Verificar si ya tiene presupuesto
    const existe = await this.presupuestoRepository.findOne({
      where: { orden: { id: orderId } },
    });

    if (existe) {
      throw new BadRequestException('La orden ya tiene un presupuesto asociado');
    }

    const presupuesto = this.presupuestoRepository.create({
      ...presupuestoData,
      orden,
    });

    return this.presupuestoRepository.save(presupuesto);
  }

  async assignCasillero(orderId: number, casilleroData: Partial<Casillero>): Promise<Casillero> {
    const orden = await this.findOne(orderId);

    // Verificar si ya tiene casillero
    const existe = await this.casilleroRepository.findOne({
      where: { order: { id: orderId } },
    });

    if (existe) {
      throw new BadRequestException('La orden ya tiene un casillero asociado');
    }

    const casillero = this.casilleroRepository.create({
      ...casilleroData,
      order: orden,
    });

    return this.casilleroRepository.save(casillero);
  }

  async addEvidenciaTecnica(orderId: number, evidenciaData: Partial<EvidenciaTecnica>): Promise<EvidenciaTecnica> {
    const orden = await this.findOne(orderId);

    const evidencia = this.evidenciaTecnicaRepository.create({
      ...evidenciaData,
      orden,
    });

    return this.evidenciaTecnicaRepository.save(evidencia);
  }

  async changeEstadoOrden(
    orderId: number,
    estadoOrdenId: number,
    userId: number
  ): Promise<Order> {
    const orden = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['estadoOrden']
    });

    if (!orden) {
      throw new NotFoundException('Orden no encontrada');
    }

    const nuevoEstado = await this.estadoOrdenRepository.findOne({
      where: { id: estadoOrdenId }
    });

    if (!nuevoEstado) {
      throw new NotFoundException('Estado de orden no encontrado');
    }

    const usuario = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Registrar en el historial
    const historial = new HistorialEstadoOrden();
    historial.orden = orden;
    historial.estadoOrden = nuevoEstado;
    historial.usuario = usuario;
    historial.fechaCambio = new Date();

    await this.historialEstadoOrdenRepository.save(historial);

    // Actualizar el estado actual
    orden.estadoOrden = nuevoEstado;
    return this.orderRepository.save(orden);
  }
}