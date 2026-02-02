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
import { Casillero } from 'src/casillero/entities/casillero.entity';
import { EvidenciaTecnica } from 'src/evidencia-tecnica/entities/evidencia-tecnica.entity';
import { HistorialEstadoOrden } from 'src/historial-estado-orden/entities/historial-estado-orden.entity';
import { EstadoCasillero } from 'src/common/enums/estadoCasillero.enum';

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

    // Validar tipos de datos numéricos
    if (createDto.clientId <= 0 || createDto.equipoId <= 0) {
      throw new BadRequestException('clientId y equipoId deben ser números positivos');
    }

    // Validar y trim de strings
    const problemaReportado = createDto.problemaReportado.trim();
    if (problemaReportado.length === 0) {
      throw new BadRequestException('problemaReportado no puede estar vacío');
    }

    // Validar fechaPrometidaEntrega no esté en el pasado
    if (createDto.fechaPrometidaEntrega) {
      const fechaPromesa = new Date(createDto.fechaPrometidaEntrega);
      if (fechaPromesa < new Date()) {
        throw new BadRequestException('fechaPrometidaEntrega no puede estar en el pasado');
      }
    }

    // Validar accesorios si se proporcionan
    if (createDto.accesorios && createDto.accesorios.length === 0) {
      throw new BadRequestException('accesorios no puede ser un array vacío, omítelo si no hay');
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
      throw new BadRequestException('No se pudo determinar el estado de la orden');
    }

    // Crear y guardar la orden
    const nuevaOrden = this.orderRepository.create({
      workOrderNumber,
      estado: true,
      client,
      equipo,
      technician,
      recepcionista,
      problemaReportado,
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
    // Validar que ID sea válido
    if (!id || id <= 0) {
      throw new BadRequestException(`ID de ${role} debe ser un número positivo`);
    }

    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`${role} con ID ${id} no encontrado`);
    }

    if (user.deletedAt) {
      throw new BadRequestException(`${role} con ID ${id} ha sido eliminado`);
    }

    return user;
  }

  private async validateEquipo(id: number): Promise<Equipo> {
    // Validar que ID sea válido
    if (!id || id <= 0) {
      throw new BadRequestException(`ID de Equipo debe ser un número positivo`);
    }

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
    if (!id || id <= 0) {
      throw new BadRequestException(`ID de estado debe ser un número positivo`);
    }

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
    // Optimizado: solo cargar relaciones esenciales
    return this.orderRepository.find({
      where: includeInactive ? {} : { estado: true },
      withDeleted: includeInactive,
      relations: [
        'client',
        'technician',
        'estadoOrden',
      ],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: number, includeInactive = false): Promise<Order> {
    if (!id || id <= 0) {
      throw new BadRequestException(`ID de orden debe ser un número positivo`);
    }

    const orden = await this.orderRepository.findOne({
      where: { id },
      withDeleted: includeInactive,
      relations: [
        'client',
        'technician',
        'recepcionista',
        'equipo',
        'estadoOrden',
      ],
    });

    if (!orden || (!includeInactive && !orden.estado)) {
      throw new NotFoundException('Orden no encontrada');
    }

    return orden;
  }

  async update(id: number, updateDto: UpdateOrderDto, userId?: number): Promise<Order> {
    // Validar ID
    if (!id || id <= 0) {
      throw new BadRequestException(`ID de orden debe ser un número positivo`);
    }

    const orden = await this.findOne(id, true);
    const cambiosHistorial: string[] = [];

    // Validar usuario de cambio si viene
    let usuarioCambio: User | null = null;
    if (updateDto.userId) {
      usuarioCambio = await this.userRepository.findOneBy({ id: updateDto.userId });
      if (!usuarioCambio) {
        throw new NotFoundException(`Usuario con ID ${updateDto.userId} no encontrado`);
      }
    }

    // Validar y actualizar problema reportado
    if (updateDto.problemaReportado !== undefined) {
      const problemaReportado = updateDto.problemaReportado.trim();
      if (problemaReportado.length === 0) {
        throw new BadRequestException('problemaReportado no puede estar vacío');
      }
      orden.problemaReportado = problemaReportado;
    }

    // Validar fecha prometida entrega
    if (updateDto.fechaPrometidaEntrega !== undefined) {
      if (updateDto.fechaPrometidaEntrega) {
        const fechaPromesa = new Date(updateDto.fechaPrometidaEntrega);
        if (fechaPromesa < new Date()) {
          throw new BadRequestException('fechaPrometidaEntrega no puede estar en el pasado');
        }
        orden.fechaPrometidaEntrega = fechaPromesa;
      } else {
        orden.fechaPrometidaEntrega = null;
      }
    }

    // Manejo del casillero (igual que antes)
    if (updateDto.casilleroId !== undefined) {
      if (updateDto.casilleroId && updateDto.casilleroId > 0) {
        const nuevoCasillero = await this.casilleroRepository.findOne({
          where: { id: updateDto.casilleroId },
          relations: ['order'],
        });

        if (!nuevoCasillero) {
          throw new NotFoundException(`Casillero con ID ${updateDto.casilleroId} no encontrado`);
        }

        if (nuevoCasillero.order && nuevoCasillero.order.id !== id) {
          throw new BadRequestException(`El casillero ${nuevoCasillero.codigo} ya está asignado a otra orden`);
        }

        // Liberar casillero actual si existe y es distinto
        if (orden.casilleroId && orden.casilleroId !== updateDto.casilleroId) {
          const casilleroActual = await this.casilleroRepository.findOneBy({ id: orden.casilleroId });
          if (casilleroActual) {
            casilleroActual.situacion = EstadoCasillero.DISPONIBLE;
            casilleroActual.order = null;
            await this.casilleroRepository.save(casilleroActual);
            cambiosHistorial.push(`Casillero liberado: ${casilleroActual.codigo}`);
          }
        }

        // Asignar nuevo casillero
        if (!nuevoCasillero.order || nuevoCasillero.order.id === id) {
          nuevoCasillero.situacion = EstadoCasillero.OCUPADO;
          nuevoCasillero.order = orden;
          await this.casilleroRepository.save(nuevoCasillero);

          orden.casillero = nuevoCasillero;
          orden.casilleroId = nuevoCasillero.id;

          cambiosHistorial.push(`Casillero asignado: ${nuevoCasillero.codigo}`);
        }
      }
    }

    // Manejo cliente, equipo, técnico ...
    if (updateDto.clientId && updateDto.clientId !== orden.client?.id) {
      if (updateDto.clientId <= 0) {
        throw new BadRequestException('clientId debe ser un número positivo');
      }
      const client = await this.validateUser(updateDto.clientId, 'Cliente');
      orden.client = client;
      cambiosHistorial.push(`Cliente cambiado a ${client.nombre}`);
    }

    if (updateDto.equipoId && updateDto.equipoId !== orden.equipo?.id) {
      if (updateDto.equipoId <= 0) {
        throw new BadRequestException('equipoId debe ser un número positivo');
      }
      const equipo = await this.validateEquipo(updateDto.equipoId);
      orden.equipo = equipo;
      cambiosHistorial.push(`Equipo cambiado a ${equipo.numeroSerie}`);
    }

    if (updateDto.technicianId !== undefined) {
      const oldTech = orden.technician?.nombre;

      if (updateDto.technicianId === null) {
        orden.technician = null;
        cambiosHistorial.push('Técnico removido');
      } else if (updateDto.technicianId > 0) {
        const technician = await this.validateUser(updateDto.technicianId, 'Técnico');
        orden.technician = technician;
        if (!oldTech || technician.id !== orden.technician?.id) {
          cambiosHistorial.push(`Técnico cambiado a ${technician.nombre}`);
        }
      }
    }

    // Manejo del estado de la orden + historial
    if (updateDto.estadoOrdenId !== undefined && updateDto.estadoOrdenId !== orden.estadoOrden?.id) {
      const estadoOrden = updateDto.estadoOrdenId
        ? await this.validateEstadoOrden(updateDto.estadoOrdenId)
        : await this.getDefaultEstadoOrden();

      if (!usuarioCambio) {
        throw new BadRequestException('Se requiere un usuario válido para cambiar el estado');
      }

      const historialEstado = new HistorialEstadoOrden();
      historialEstado.orden = { id: orden.id } as Order;  // **solo ID, evitar problemas**
      historialEstado.estadoOrden = estadoOrden;
      historialEstado.usuario = usuarioCambio;
      historialEstado.fechaCambio = new Date();
      historialEstado.observaciones = 'Estado cambiado desde actualización';

      await this.historialEstadoOrdenRepository.save(historialEstado);

      orden.estadoOrden = estadoOrden;
      cambiosHistorial.push(`Estado cambiado a: ${estadoOrden.nombre}`);
    }

    // Campos simples
    if (updateDto.accesorios !== undefined) {
      if (Array.isArray(updateDto.accesorios) && updateDto.accesorios.length === 0) {
        throw new BadRequestException('accesorios no puede ser un array vacío, usa null para remover');
      }
      orden.accesorios = updateDto.accesorios;
      cambiosHistorial.push('Accesorios actualizados');
    }

    // Validación coherencia estado y casillero
    if (orden.estadoOrden && orden.estadoOrden.nombre.toLowerCase().includes('almacén') && !orden.casillero) {
      throw new BadRequestException('Para estados de almacén se requiere asignar un casillero');
    }

    // *** Antes de guardar orden, elimina historialEstados para no propagar ***
    delete (orden as any).historialEstados;

    // *** Guarda SOLO la orden (sin relaciones) con update parcial ***
    await this.orderRepository.update(orden.id, {
      problemaReportado: orden.problemaReportado,
      fechaPrometidaEntrega: orden.fechaPrometidaEntrega,
      accesorios: orden.accesorios,
      estadoOrden: orden.estadoOrden,
      casillero: orden.casillero,
      client: orden.client,
      equipo: orden.equipo,
      technician: orden.technician,
    });

    // Registrar cambios adicionales en historial si los hay
    if (cambiosHistorial.length > 0) {
      const historial = new HistorialEstadoOrden();
      historial.orden = { id: orden.id } as Order;
      historial.estadoOrden = orden.estadoOrden;
      historial.usuario = usuarioCambio!;
      historial.fechaCambio = new Date();
      historial.observaciones = cambiosHistorial.join(', ');

      await this.historialEstadoOrdenRepository.save(historial);
    }

    // Finalmente devuelve la orden actualizada
    return this.findOne(id, true);
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
    // Validar page y limit
    const validatedPage = Math.max(1, parseInt(page.toString()) || 1);
    const ALLOWED_LIMITS = [10, 25, 50, 100];
    const validatedLimit = ALLOWED_LIMITS.includes(limit) ? limit : 10;

    // Validar fechas si se proporcionan
    if (fechaInicio && fechaFin) {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      if (inicio > fin) {
        throw new BadRequestException('fechaInicio no puede ser mayor que fechaFin');
      }
      // Validar que no sean fechas futuras (opcional según negocio)
      if (fin > new Date()) {
        throw new BadRequestException('fechaFin no puede estar en el futuro');
      }
    }

    const skip = (validatedPage - 1) * validatedLimit;

    const query = this.orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.client', 'client')
      .leftJoinAndSelect('order.technician', 'technician')
      .leftJoinAndSelect('order.estadoOrden', 'estadoOrden')
      .leftJoinAndSelect('order.equipo', 'equipo')
      .orderBy('order.createdAt', 'DESC');

    // Manejo de la búsqueda corregido
    if (search && search.trim()) {
      query.where(
        '(LOWER(order.workOrderNumber) LIKE LOWER(:search) OR ' +
        'LOWER(client.nombre) LIKE LOWER(:search))',
        { search: `%${search.trim()}%` }
      );
    }

    // Filtros adicionales
    if (estadoOrdenId && estadoOrdenId > 0) {
      query.andWhere('order.estadoOrdenId = :estadoOrdenId', { estadoOrdenId });
    }

    if (technicianId && technicianId > 0) {
      query.andWhere('order.technicianId = :technicianId', { technicianId });
    }

    if (clientId && clientId > 0) {
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
      .take(validatedLimit)
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
    if (!orderId || orderId <= 0) {
      throw new BadRequestException('orderId debe ser un número positivo');
    }

    if (!actividadData) {
      throw new BadRequestException('Datos de actividad técnica requeridos');
    }

    const orden = await this.findOne(orderId);

    const actividad = this.actividadTecnicaRepository.create({
      ...actividadData,
      orden,
    });

    return this.actividadTecnicaRepository.save(actividad);
  }

  async addPresupuesto(orderId: number, presupuestoData: Partial<Presupuesto>): Promise<Presupuesto> {
    if (!orderId || orderId <= 0) {
      throw new BadRequestException('orderId debe ser un número positivo');
    }

    if (!presupuestoData) {
      throw new BadRequestException('Datos de presupuesto requeridos');
    }

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
    if (!orderId || orderId <= 0) {
      throw new BadRequestException('orderId debe ser un número positivo');
    }

    if (!casilleroData) {
      throw new BadRequestException('Datos de casillero requeridos');
    }

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
    if (!orderId || orderId <= 0) {
      throw new BadRequestException('orderId debe ser un número positivo');
    }

    if (!evidenciaData) {
      throw new BadRequestException('Datos de evidencia técnica requeridos');
    }

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
    // Validar IDs
    if (!orderId || orderId <= 0) {
      throw new BadRequestException('orderId debe ser un número positivo');
    }
    if (!estadoOrdenId || estadoOrdenId <= 0) {
      throw new BadRequestException('estadoOrdenId debe ser un número positivo');
    }
    if (!userId || userId <= 0) {
      throw new BadRequestException('userId debe ser un número positivo');
    }

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

    if (usuario.deletedAt) {
      throw new BadRequestException('El usuario ha sido eliminado');
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

  // order.service.ts
  async findOrdersByClient(clientId: number): Promise<Order[]> {
    if (!clientId || clientId <= 0) {
      throw new BadRequestException('clientId debe ser un número positivo');
    }

    // Validar que el cliente existe
    const client = await this.userRepository.findOne({
      where: { id: clientId }
    });

    if (!client) {
      throw new NotFoundException(`Cliente con ID ${clientId} no encontrado`);
    }

    return this.orderRepository.find({
      where: {
        client: { id: clientId },
        estado: true,
        deletedAt: null,
      },
      relations: ['client', 'technician', 'estadoOrden'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOrdersByTechnician(technicianId: number): Promise<Order[]> {
    if (!technicianId || technicianId <= 0) {
      throw new BadRequestException('technicianId debe ser un número positivo');
    }

    // Validar que el técnico existe
    const technician = await this.userRepository.findOne({
      where: { id: technicianId }
    });

    if (!technician) {
      throw new NotFoundException(`Técnico con ID ${technicianId} no encontrado`);
    }

    return this.orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.client', 'client')
      .leftJoinAndSelect('order.technician', 'technician')
      .leftJoinAndSelect('order.estadoOrden', 'estadoOrden')
      .where('technician.id = :technicianId', { technicianId })
      .andWhere('order.estado = :estado', { estado: true })
      .andWhere('order.deletedAt IS NULL')
      .orderBy('order.createdAt', 'DESC')
      .getMany();
  }
}