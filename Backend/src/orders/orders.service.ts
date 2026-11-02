import { Injectable, BadRequestException, NotFoundException, ConflictException, Logger, InternalServerErrorException, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Order } from './entities/order.entity';
import { User } from '../users/entities/user.entity';
import { Equipo } from 'src/equipo/entities/equipo.entity';
import { EstadoOrden } from 'src/estado-orden/entities/estado-orden.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ConvertirOrdenCompletaDto } from './dto/convertir-orden.dto';
import { OrderType } from 'src/common/enums/order-type.enum';
import { ActividadTecnica } from 'src/actividad-tecnica/entities/actividad-tecnica.entity';
import { Presupuesto } from 'src/presupuesto/entities/presupuesto.entity';
import { PresupuestoService } from 'src/presupuesto/presupuesto.service';
import { Casillero } from 'src/casillero/entities/casillero.entity';
import { EvidenciaTecnica } from 'src/evidencia-tecnica/entities/evidencia-tecnica.entity';
import { HistorialEstadoOrden } from 'src/historial-estado-orden/entities/historial-estado-orden.entity';
import { EstadoCasillero } from 'src/common/enums/estadoCasillero.enum';
import { NotificacionService } from '../notificacion/notificacion.service';
import { StorageService } from '../storage/storage.service';
import { ConfiguracionSistemaService } from '../configuracion-sistema/configuracion-sistema.service';
import { DocumentoOrden, TipoDocumentoOrden, EstadoFirmaDocumento } from '../documentos-orden/entities/documento-orden.entity';
import { DocumentosOrdenService } from '../documentos-orden/documentos-orden.service';
import { AutorizacionPresupuesto, DecisionPresupuesto, ModalidadAutorizacion } from 'src/presupuesto/entities/autorizacion-presupuesto.entity';
import { AutorizarPresupuestoPrivadoDto } from './dto/autorizar-presupuesto-privado.dto';
import { AutorizarPresupuestoPresencialDto } from './dto/autorizar-presupuesto-presencial.dto';
import * as crypto from 'crypto';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

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
    @InjectRepository(AutorizacionPresupuesto)
    private readonly autorizacionRepository: Repository<AutorizacionPresupuesto>,
    @InjectRepository(Casillero)
    private readonly casilleroRepository: Repository<Casillero>,
    @InjectRepository(EvidenciaTecnica)
    private readonly evidenciaTecnicaRepository: Repository<EvidenciaTecnica>,
    @InjectRepository(HistorialEstadoOrden)
    private readonly historialEstadoOrdenRepository: Repository<HistorialEstadoOrden>,
    @InjectRepository(DocumentoOrden)
    private readonly documentoRepository: Repository<DocumentoOrden>,
    private readonly notificacionService: NotificacionService,
    private readonly storageService: StorageService,
    private readonly presupuestoService: PresupuestoService,
    private readonly configuracionSistemaService: ConfiguracionSistemaService,
    private readonly documentosOrdenService: DocumentosOrdenService,
  ) { }

  async create(createDto: CreateOrderDto): Promise<Order> {
    // 1. Idempotencia persistente en PostgreSQL (resistente a caídas y reinicios)
    if (createDto.clientRequestId) {
      const existingInDb = await this.orderRepository.findOne({
        where: { clientRequestId: createDto.clientRequestId },
      });
      if (existingInDb) {
        this.logger.warn(
          `Idempotencia persistente: Petición duplicada interceptada en PostgreSQL (clientRequestId=${createDto.clientRequestId}). Retornando orden existente #${existingInDb.id}`,
        );
        return this.findOne(existingInDb.id, true);
      }
    }

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

    // Validar fechaPrometidaEntrega no esté en el pasado (comparamos solo el día)
    if (createDto.fechaPrometidaEntrega) {
      const fechaPromesa = new Date(createDto.fechaPrometidaEntrega);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (fechaPromesa < hoy) {
        throw new BadRequestException('fechaPrometidaEntrega no puede ser anterior a hoy');
      }
    }

    // Validar accesorios si se proporcionan
    if (createDto.accesorios && createDto.accesorios.length === 0) {
      // Permitimos arrays vacíos
    }

    // Generar número de orden (versión corregida)
    const workOrderNumber = await this.generateOrderNumber();

    // Validar que el equipo no esté actualmente en taller en una orden activa
    try {
      await this.validarDisponibilidadEquipo(createDto.equipoId);
    } catch (valErr) {
      if (createDto.clientRequestId) {
        const existingOrder = await this.orderRepository.findOne({
          where: { clientRequestId: createDto.clientRequestId },
        });
        if (existingOrder) {
          this.logger.warn(
            `Idempotencia concurrente detectada durante validación de equipo (clientRequestId=${createDto.clientRequestId}). Retornando orden existente #${existingOrder.id}`,
          );
          return this.findOne(existingOrder.id, true);
        }
      }
      throw valErr;
    }

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
      : await this.getDefaultEstadoOrden();

    if (!estadoOrden) {
      throw new BadRequestException('No se pudo determinar el estado de la orden');
    }

    // Generar credencial criptográfica de alta entropía (128 bits = 16 bytes = 32 caracteres hex)
    const rawSecret = crypto.randomBytes(16).toString('hex');
    const tokenAccesoHash = crypto.createHash('sha256').update(rawSecret).digest('hex');
    const tokenAccesoExpiracion = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 días

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
      estadoOrden,
      tipoOrden: createDto.tipoOrden,
      checklistData: createDto.checklistData,
      esperaRepuesto: createDto.esperaRepuesto || false,
      tiempoEstimadoReparacion: createDto.tiempoEstimadoReparacion || 0,
      clientRequestId: createDto.clientRequestId || null,
      tokenAccesoHash,
      tokenAccesoExpiracion,
      tokenAccesoRevocado: false,
      tokenAccesoIntentosFallidos: 0,
      entregadoPorNombre: createDto.entregadoPorNombre || null,
      entregadoPorCedula: createDto.entregadoPorCedula || null,
      entregadoPorParentesco: createDto.entregadoPorParentesco || null,
    });

    let ordenGuardada: Order;
    try {
      ordenGuardada = await this.orderRepository.save(nuevaOrden);
    } catch (error: any) {
      // Carrera de concurrencia exacta en PostgreSQL (código 23505 - unique_violation)
      if (
        createDto.clientRequestId &&
        (error?.code === '23505' || error?.message?.includes('clientRequestId') || error?.message?.includes('duplicate key'))
      ) {
        this.logger.warn(
          `Carrera de peticiones simultáneas interceptada por restricción UNIQUE de PostgreSQL (clientRequestId=${createDto.clientRequestId}). Retornando orden ya comprometida...`,
        );
        const existingOrder = await this.orderRepository.findOne({
          where: { clientRequestId: createDto.clientRequestId },
        });
        if (existingOrder) {
          return this.findOne(existingOrder.id, true);
        }
      }
      throw error;
    }

    // Crear historial
    await this.createHistorial(ordenGuardada, estadoOrden, recepcionista || technician || client);

    // Notificaciones automáticas
    if (technician) {
      await this.notificacionService.notificarAsignacionTecnico(ordenGuardada.id, technician.id, workOrderNumber);
    }
    if (client) {
      await this.notificacionService.notificarCambioEstadoOds(ordenGuardada.id, client.id, workOrderNumber, estadoOrden.nombre);
    }

    // Adjuntar la credencial en texto claro de forma efímera para la impresión del comprobante/ODS
    const resultado = {
      ...ordenGuardada,
      tokenAccesoRaw: rawSecret,
    };

    return resultado as any;
  }

  // Métodos auxiliares corregidos
  private async generateOrderNumber(): Promise<string> {
    try {
      if (this.configuracionSistemaService) {
        return await this.configuracionSistemaService.generarSiguienteNumeroOrden();
      }
    } catch (err) {
      this.logger.warn(`Error obteniendo número de orden desde configuración: ${err.message}`);
    }

    try {
      // Obtener la última orden como fallback
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
      const siguienteNumero = parseInt(soloNumeros, 10) + 1;

      // Formatear a 5 dígitos con ceros a la izquierda
      return siguienteNumero.toString().padStart(5, '0');

    } catch (error) {
      this.logger.error('Error generando numero de orden', error instanceof Error ? error.stack : undefined);
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

  /**
   * Valida que un equipo no se encuentre actualmente en taller bajo una orden activa.
   * Si ordenIdExcluida se especifica (caso de edición), se ignora dicha orden.
   */
  async validarDisponibilidadEquipo(equipoId: number, ordenIdExcluida?: number): Promise<void> {
    if (!equipoId || equipoId <= 0) return;

    const qb = this.orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.estadoOrden', 'estadoOrden')
      .where('order.equipoId = :equipoId', { equipoId })
      .andWhere('order.estado = :estado', { estado: true })
      .andWhere('order.deletedAt IS NULL')
      .andWhere('LOWER(estadoOrden.nombre) NOT IN (:...estadosFinales)', {
        estadosFinales: ['archivados', 'anulado', 'cancelado'],
      });

    if (ordenIdExcluida) {
      qb.andWhere('order.id != :ordenIdExcluida', { ordenIdExcluida });
    }

    const ordenActiva = await qb.getOne();

    if (ordenActiva) {
      const estadoNombre = ordenActiva.estadoOrden?.nombre || 'En taller';
      throw new ConflictException(
        `El equipo ya se encuentra en taller bajo la orden #${ordenActiva.workOrderNumber} (Estado: ${estadoNombre}). No se puede crear un nuevo ingreso hasta completar la entrega de la orden previa.`
      );
    }
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
    // Intentamos encontrar el estado Recepción o su equivalente
    const qb = this.estadoOrdenRepository.createQueryBuilder("estado");
    let defaultState = await qb
      .where("LOWER(estado.nombre) LIKE :nombre", { nombre: '%recepci%' })
      .getOne();

    if (!defaultState) {
      defaultState = await this.estadoOrdenRepository.findOne({ order: { id: 'ASC' } });
    }

    if (!defaultState) {
      throw new NotFoundException('No hay estados de orden configurados en la base de datos');
    }

    return defaultState;
  }

  private async createHistorial(
    orden: Order,
    estado: EstadoOrden,
    usuario: User
  ): Promise<void> {
    const historial = new HistorialEstadoOrden(orden, estado, usuario);
    await this.historialEstadoOrdenRepository.save(historial);
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
        'equipo.tipoEquipo',
        'equipo.marca',
        'equipo.modelo',
        'estadoOrden',
        'actividades',
        'actividades.tipoActividad',
        'presupuesto',
        'presupuesto.estado',
        'presupuesto.detallesPresupuestoItems',
        'presupuesto.detallesPresupuestoItems.parte',
        'casillero',
        'evidencias',
        'evidencias.subidoPor',
        'evidencias.estadoOrden',
        'historialEstados',
        'historialEstados.estadoOrden',
        'historialEstados.usuario',
      ],
    });

    if (!orden || (!includeInactive && !orden.estado)) {
      throw new NotFoundException('Orden no encontrada');
    }

    if (orden.evidencias && orden.evidencias.length > 0) {
      await Promise.all(
        orden.evidencias.map(async (ev) => {
          if (ev.storageKey) {
            try {
              ev.archivoUrl = await this.storageService.getPresignedUrl(ev.storageKey);
            } catch (err) {
              this.logger.warn(`Error resolviendo URL firmada para evidencia ${ev.id}: ${err.message}`);
            }
          }
        }),
      );
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

    // Validar usuario de cambio si viene en DTO o argumento
    const effectiveUserId = updateDto.userId || userId;
    let usuarioCambio: User | null = null;
    if (effectiveUserId) {
      usuarioCambio = await this.userRepository.findOneBy({ id: effectiveUserId });
      if (!usuarioCambio) {
        throw new NotFoundException(`Usuario con ID ${effectiveUserId} no encontrado`);
      }
    }

    // 1. Control de Concurrencia Optimista (Escenario A)
    if (updateDto.version !== undefined && orden.version !== undefined) {
      if (Number(updateDto.version) !== Number(orden.version)) {
        throw new ConflictException(
          `Conflicto de concurrencia: La orden fue modificada por otro usuario (Versión en base de datos: ${orden.version}, versión de su formulario: ${updateDto.version}). Recargue los datos para ver los cambios recientes antes de guardar.`
        );
      }
    }

    // 2. Control de Inmutabilidad Post-Firma de Recepción (Escenario D)
    const actaRecepcionFirmada = await this.documentoRepository.findOne({
      where: {
        ordenId: id,
        tipoDocumento: TipoDocumentoOrden.RECEPCION,
        estadoFirma: EstadoFirmaDocumento.FIRMADO,
      },
    });

    if (actaRecepcionFirmada) {
      // Prohibir cambio de cliente o equipo
      if (updateDto.clientId !== undefined && Number(updateDto.clientId) !== Number(orden.clientId)) {
        throw new BadRequestException(
          `No es posible transferir el cliente de esta orden porque ya existe un Acta de Recepción firmada legalmente (Acta #${actaRecepcionFirmada.id}).`
        );
      }
      if (updateDto.equipoId !== undefined && Number(updateDto.equipoId) !== Number(orden.equipoId)) {
        throw new BadRequestException(
          `No es posible transferir el equipo de esta orden porque ya existe un Acta de Recepción firmada legalmente (Acta #${actaRecepcionFirmada.id}).`
        );
      }

      // Prohibir alteración del problema reportado original firmado
      if (updateDto.problemaReportado !== undefined && updateDto.problemaReportado.trim() !== orden.problemaReportado.trim()) {
        throw new BadRequestException(
          'Los datos de recepción inicial (problema reportado por el cliente) están blindados legalmente por el Acta de Recepción firmada. Para registrar nuevos hallazgos diagnósticos o fallas adicionales, regístrelos en las Actividades Técnicas de la orden.'
        );
      }

      // Prohibir alteración de accesorios iniciales firmados
      if (updateDto.accesorios !== undefined) {
        const curAcc = (orden.accesorios || []).slice().sort().join('|');
        const newAcc = (updateDto.accesorios || []).slice().sort().join('|');
        if (curAcc !== newAcc) {
          throw new BadRequestException(
            'Los accesorios recibidos están protegidos por el Acta de Recepción firmada por el cliente. Si el cliente trajo un accesorio adicional con posterioridad, regístrelo mediante una nota en la bitácora técnica.'
          );
        }
      }

      // Prohibir alteración del checklist inicial firmado
      if (updateDto.checklistData !== undefined && JSON.stringify(updateDto.checklistData) !== JSON.stringify(orden.checklistData)) {
        throw new BadRequestException(
          'El peritaje físico de ingreso está sellado por el Acta de Recepción firmada. Para nuevos daños detectados durante el desarme, adjunte una evidencia técnica fotográfica.'
        );
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

        // Solo validamos si la fecha cambió
        const fechaActual = orden.fechaPrometidaEntrega ? new Date(orden.fechaPrometidaEntrega).getTime() : null;
        if (fechaActual !== fechaPromesa.getTime()) {
          const hoy = new Date();
          hoy.setHours(0, 0, 0, 0);
          if (fechaPromesa < hoy) {
            throw new BadRequestException('fechaPrometidaEntrega no puede ser anterior a hoy');
          }
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
          nuevoCasillero.orderId = orden.id;
          await this.casilleroRepository.save(nuevoCasillero);

          orden.casillero = nuevoCasillero;
          orden.casilleroId = nuevoCasillero.id;

          cambiosHistorial.push(`Casillero asignado: ${nuevoCasillero.codigo}`);
        }
      } else {
        // Liberar casillero si updateDto.casilleroId es null o <= 0
        if (orden.casilleroId || orden.casillero) {
          const cId = orden.casilleroId || orden.casillero?.id;
          const casilleroActual = await this.casilleroRepository.findOneBy({ id: cId });
          if (casilleroActual) {
            casilleroActual.situacion = EstadoCasillero.DISPONIBLE;
            casilleroActual.order = null;
            casilleroActual.orderId = null;
            await this.casilleroRepository.save(casilleroActual);
            cambiosHistorial.push(`Casillero liberado: ${casilleroActual.codigo}`);
          }
          orden.casillero = null;
          orden.casilleroId = null;
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
      await this.validarDisponibilidadEquipo(updateDto.equipoId, orden.id);
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
          await this.notificacionService.notificarAsignacionTecnico(orden.id, technician.id, orden.workOrderNumber);
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

      // Notificaciones automáticas de cambio de estado
      if (orden.clientId) {
        await this.notificacionService.notificarCambioEstadoOds(orden.id, orden.clientId, orden.workOrderNumber, estadoOrden.nombre);
      }
      if (orden.technicianId) {
        await this.notificacionService.notificarCambioEstadoOds(orden.id, orden.technicianId, orden.workOrderNumber, estadoOrden.nombre);
      }

      const esEstadoLiberador = ['archiv', 'entrega', 'entregad', 'anulad', 'cancelad', 'finaliz']
        .some(term => estadoOrden.nombre.toLowerCase().includes(term));

      if (esEstadoLiberador && (orden.casillero || orden.casilleroId)) {
        const cId = orden.casillero?.id || orden.casilleroId;
        const casilleroActual = await this.casilleroRepository.findOneBy({ id: cId });
        if (casilleroActual) {
          casilleroActual.situacion = EstadoCasillero.DISPONIBLE;
          casilleroActual.order = null;
          casilleroActual.orderId = null;
          await this.casilleroRepository.save(casilleroActual);
          orden.casillero = null;
          orden.casilleroId = null;
          cambiosHistorial.push(`Casillero ${casilleroActual.codigo} liberado por cambio de estado a ${estadoOrden.nombre}`);
        }
      }
    }

    // Campos simples
    if (updateDto.accesorios !== undefined) {
      orden.accesorios = updateDto.accesorios;
      cambiosHistorial.push('Accesorios actualizados');
    }

    if (updateDto.tipoOrden !== undefined) {
      orden.tipoOrden = updateDto.tipoOrden;
      cambiosHistorial.push(`Tipo de orden actualizado a ${updateDto.tipoOrden}`);
    }

    if (updateDto.checklistData !== undefined) {
      orden.checklistData = updateDto.checklistData;
      cambiosHistorial.push('Datos de peritaje actualizados');
    }

    if (updateDto.esperaRepuesto !== undefined) {
      orden.esperaRepuesto = updateDto.esperaRepuesto;
      cambiosHistorial.push(`Orden marcada en espera de repuestos: ${updateDto.esperaRepuesto ? 'Sí' : 'No'}`);
    }

    if (updateDto.tiempoEstimadoReparacion !== undefined) {
      orden.tiempoEstimadoReparacion = updateDto.tiempoEstimadoReparacion;
      cambiosHistorial.push(`Tiempo estimado de reparación actualizado a ${updateDto.tiempoEstimadoReparacion} horas`);
    }

    // Validación coherencia estado y casillero
    if (orden.estadoOrden && orden.estadoOrden.nombre.toLowerCase().includes('almacén') && !orden.casillero) {
      throw new BadRequestException('Para estados de almacén se requiere asignar un casillero');
    }

    // *** Antes de guardar orden, elimina historialEstados para no propagar ***
    delete (orden as any).historialEstados;

    const currentVersion = orden.version || 1;
    const nextVersion = currentVersion + 1;

    // Actualización atómica con verificación de versión (Escenario A)
    const updateResult = await this.orderRepository
      .createQueryBuilder()
      .update(Order)
      .set({
        problemaReportado: orden.problemaReportado,
        fechaPrometidaEntrega: orden.fechaPrometidaEntrega,
        accesorios: orden.accesorios,
        estadoOrden: orden.estadoOrden,
        casillero: orden.casillero,
        client: orden.client,
        equipo: orden.equipo,
        technician: orden.technician,
        tipoOrden: orden.tipoOrden,
        checklistData: orden.checklistData,
        esperaRepuesto: orden.esperaRepuesto,
        tiempoEstimadoReparacion: orden.tiempoEstimadoReparacion,
        version: nextVersion,
      })
      .where('id = :id AND (version = :currentVersion OR version IS NULL)', {
        id: orden.id,
        currentVersion,
      })
      .execute();

    if (updateResult.affected === 0) {
      throw new ConflictException(
        'Conflicto de concurrencia: La orden fue modificada simultáneamente por otro usuario en el servidor. Por favor recargue los datos para ver la información más reciente.'
      );
    }

    // Registrar cambios adicionales en historial si los hay (Escenario A - Trazabilidad de ambos trabajadores)
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

  async convertirOrdenACompleta(
    id: number,
    dto: ConvertirOrdenCompletaDto,
    usuarioId?: number,
  ): Promise<Order> {
    const orden = await this.findOne(id, true);

    if (orden.tipoOrden === OrderType.COMPLETA) {
      throw new BadRequestException('La orden ya es de tipo Completa');
    }

    if (!dto.motivoEscalamiento || !dto.motivoEscalamiento.trim()) {
      throw new BadRequestException('El motivo de escalamiento es obligatorio');
    }

    let usuarioCambio: User | null = null;
    const effectiveUserId = dto.userId || usuarioId;
    if (effectiveUserId) {
      usuarioCambio = await this.userRepository.findOne({ where: { id: effectiveUserId } });
    }

    // Preservar fielmente la inspección de recepción previa
    const previoChecklist = orden.checklistData;
    let baseRecepcion: any = null;

    if (previoChecklist && previoChecklist.version === 2) {
      baseRecepcion = previoChecklist.inspeccionRecepcion || null;
    } else if (previoChecklist && Array.isArray(previoChecklist.results)) {
      baseRecepcion = previoChecklist;
    } else {
      baseRecepcion = {
        fecha: orden.createdAt,
        responsable: orden.technician ? `${orden.technician.nombre} ${orden.technician.apellido}` : 'Recepción',
        estadoEncendido: 'no_probado',
        observacionGeneral: 'Sin inspección técnica previa (Ingresó originalmente como Orden Express)',
        fisica: [],
        funcional: [],
      };
    }

    const nuevaInspeccionComplementaria = {
      fecha: new Date().toISOString(),
      responsableId: effectiveUserId || undefined,
      responsableNombre: usuarioCambio ? `${usuarioCambio.nombre} ${usuarioCambio.apellido}` : 'Técnico HDC',
      motivoEscalamiento: dto.motivoEscalamiento,
      autorizacionCliente: dto.autorizacionCliente || {
        autorizado: false,
        detalles: 'Pendiente de confirmación con cliente',
      },
      estadoEncendido: dto.inspeccionComplementaria?.estadoEncendido || 'no_probado',
      fisica: dto.inspeccionComplementaria?.fisica || [],
      funcional: dto.inspeccionComplementaria?.funcional || [],
      observacionesTecnicas: dto.inspeccionComplementaria?.observacionesTecnicas || '',
    };

    const updatedChecklistData = {
      version: 2,
      tipoOrden: OrderType.COMPLETA,
      inspeccionRecepcion: baseRecepcion,
      inspeccionComplementaria: nuevaInspeccionComplementaria,
    };

    orden.tipoOrden = OrderType.COMPLETA;
    orden.checklistData = updatedChecklistData;

    await this.orderRepository.update(orden.id, {
      tipoOrden: OrderType.COMPLETA,
      checklistData: updatedChecklistData as any,
    });

    // Guardar en el historial de estados
    const historial = new HistorialEstadoOrden();
    historial.orden = { id: orden.id } as Order;
    historial.estadoOrden = orden.estadoOrden;
    if (usuarioCambio) historial.usuario = usuarioCambio;
    historial.fechaCambio = new Date();
    const authStatus = dto.autorizacionCliente?.autorizado
      ? `Autorizado vía ${dto.autorizacionCliente.medio || 'No especificado'}`
      : 'Pendiente de autorización';
    historial.observaciones = `Escalamiento Express ➔ Completa. Motivo: ${dto.motivoEscalamiento}. Cliente: ${authStatus}`;

    await this.historialEstadoOrdenRepository.save(historial);

    return this.findOne(id, true);
  }




  async remove(id: number): Promise<{ message: string }> {
    const orden = await this.findOne(id);

    // 1. Liberar casillero si la orden tenía uno asignado
    if (orden.casilleroId || orden.casillero) {
      const cId = orden.casilleroId || orden.casillero?.id;
      const casillero = await this.casilleroRepository.findOneBy({ id: cId });
      if (casillero) {
        casillero.situacion = EstadoCasillero.DISPONIBLE;
        casillero.order = null;
        casillero.orderId = null;
        await this.casilleroRepository.save(casillero);
      }
      orden.casillero = null;
      orden.casilleroId = null;
    }

    // 2. Si tenía un presupuesto activo, eliminarlo (lo que revertirá el stock al almacén si estaba aprobado)
    const presupuesto = await this.presupuestoRepository.findOne({
      where: { ordenId: id, deletedAt: IsNull() },
      relations: ['estado'],
    });
    if (presupuesto) {
      await this.presupuestoService.remove(presupuesto.id);
    }

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

    let sortOrder: 'ASC' | 'DESC' = 'ASC';
    if (estadoOrdenId && estadoOrdenId > 0) {
      const estado = await this.estadoOrdenRepository.findOne({ where: { id: estadoOrdenId } });
      if (estado) {
        const nombreBajo = estado.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (nombreBajo.includes('archiv') || nombreBajo.includes('entreg')) {
          sortOrder = 'DESC';
        }
      }
    }

    const query = this.orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.client', 'client')
      .leftJoinAndSelect('order.technician', 'technician')
      .leftJoinAndSelect('order.estadoOrden', 'estadoOrden')
      .leftJoinAndSelect('order.equipo', 'equipo')
      .leftJoinAndSelect('order.actividades', 'actividades')
      .leftJoinAndSelect('actividades.tipoActividad', 'tipoActividad')
      .leftJoinAndSelect('order.presupuesto', 'presupuesto')
      .leftJoinAndSelect('presupuesto.estado', 'estadoPresupuesto')
      .leftJoinAndSelect('presupuesto.detallesPresupuestoItems', 'detallesItems')
      .leftJoinAndSelect('detallesItems.parte', 'parteDetalle')
      .leftJoinAndSelect('order.casillero', 'casillero')
      .orderBy('order.createdAt', sortOrder);

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
      query.andWhere('estadoOrden.id = :estadoOrdenId', { estadoOrdenId });
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
      estadoOrden: orden.estadoOrden,
      estadoOrdenId: orden.estadoOrden?.id
    });

    const saved = await this.evidenciaTecnicaRepository.save(evidencia);
    if (saved.storageKey) {
      try {
        saved.archivoUrl = await this.storageService.getPresignedUrl(saved.storageKey);
      } catch (err) {
        this.logger.warn(`Error resolviendo URL firmada para evidencia ${saved.id}: ${err.message}`);
      }
    }
    return saved;
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
      relations: ['estadoOrden', 'casillero', 'client', 'technician']
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

    const esEstadoLiberador = ['archiv', 'entrega', 'entregad', 'anulad', 'cancelad', 'finaliz']
      .some(term => nuevoEstado.nombre.toLowerCase().includes(term));

    if (esEstadoLiberador && (orden.casillero || orden.casilleroId)) {
      const cId = orden.casillero?.id || orden.casilleroId;
      const casilleroActual = await this.casilleroRepository.findOneBy({ id: cId });
      if (casilleroActual) {
        casilleroActual.situacion = EstadoCasillero.DISPONIBLE;
        casilleroActual.order = null;
        casilleroActual.orderId = null;
        await this.casilleroRepository.save(casilleroActual);
        orden.casillero = null;
        orden.casilleroId = null;
      }
    }

    const saved = await this.orderRepository.save(orden);

    // Notificaciones automáticas de cambio de estado
    if (saved.client) {
      await this.notificacionService.notificarCambioEstadoOds(saved.id, saved.client.id, saved.workOrderNumber, nuevoEstado.nombre);
    }
    if (saved.technician) {
      await this.notificacionService.notificarCambioEstadoOds(saved.id, saved.technician.id, saved.workOrderNumber, nuevoEstado.nombre);
    }

    return saved;
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
      relations: [
        'client',
        'technician',
        'estadoOrden',
        'actividades',
        'actividades.tipoActividad',
        'equipo',
        'equipo.tipoEquipo',
        'equipo.marca',
        'equipo.modelo',
        'presupuesto',
        'presupuesto.estado',
        'presupuesto.detallesPresupuestoItems',
        'casillero'
      ],
      order: { createdAt: 'DESC' }
    });
  }

  async findOrdersByTechnician(technicianId: number, estadoOrdenId?: number, search?: string): Promise<Order[]> {
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

    const query = this.orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.client', 'client')
      .leftJoinAndSelect('order.technician', 'technician')
      .leftJoinAndSelect('order.estadoOrden', 'estadoOrden')
      .leftJoinAndSelect('order.equipo', 'equipo')
      .leftJoinAndSelect('equipo.tipoEquipo', 'tipoEquipo')
      .leftJoinAndSelect('equipo.marca', 'marca')
      .leftJoinAndSelect('equipo.modelo', 'modelo')
      .leftJoinAndSelect('order.actividades', 'actividades')
      .leftJoinAndSelect('actividades.tipoActividad', 'tipoActividad')
      .leftJoinAndSelect('order.presupuesto', 'presupuesto')
      .leftJoinAndSelect('presupuesto.estado', 'estadoPresupuesto')
      .leftJoinAndSelect('order.casillero', 'casillero')
      .where('technician.id = :technicianId', { technicianId })
      .andWhere('order.estado = :estado', { estado: true })
      .andWhere('order.deletedAt IS NULL');

    if (estadoOrdenId && estadoOrdenId > 0) {
      query.andWhere('estadoOrden.id = :estadoOrdenId', { estadoOrdenId });
    }

    if (search && search.trim()) {
      query.andWhere(
        '(LOWER(order.workOrderNumber) LIKE LOWER(:search) OR ' +
        'LOWER(client.nombre) LIKE LOWER(:search))',
        { search: `%${search.trim()}%` }
      );
    }

    return query.orderBy('order.createdAt', 'DESC').getMany();
  }

  async findPublicOrder(cedula?: string, workOrderNumber?: string, token?: string): Promise<any> {
    if (!workOrderNumber || workOrderNumber.trim() === '') {
      throw new BadRequestException('El número de orden es requerido');
    }

    const hasCedula = Boolean(cedula && cedula.trim() !== '');
    const hasToken = Boolean(token && token.trim() !== '');

    if (!hasCedula && !hasToken) {
      throw new BadRequestException('Debe ingresar su cédula o el código de comprobante para consultar la orden.');
    }

    const orderQuery = this.orderRepository
      .createQueryBuilder('order')
      .addSelect([
        'order.tokenAccesoHash',
        'order.tokenAccesoExpiracion',
        'order.tokenAccesoRevocado',
        'order.tokenAccesoIntentosFallidos',
        'order.tokenAccesoBloqueadoHasta',
      ])
      .leftJoinAndSelect('order.client', 'client')
      .leftJoinAndSelect('order.technician', 'technician')
      .leftJoinAndSelect('order.equipo', 'equipo')
      .leftJoinAndSelect('equipo.tipoEquipo', 'tipoEquipo')
      .leftJoinAndSelect('equipo.marca', 'marca')
      .leftJoinAndSelect('equipo.modelo', 'modelo')
      .leftJoinAndSelect('order.estadoOrden', 'estadoOrden')
      .leftJoinAndSelect('order.presupuesto', 'presupuesto')
      .leftJoinAndSelect('presupuesto.estado', 'presupuestoEstado')
      .leftJoinAndSelect('presupuesto.detallesPresupuestoItems', 'detallesPresupuestoItems')
      .leftJoinAndSelect('detallesPresupuestoItems.parte', 'parte')
      .leftJoinAndSelect('order.evidencias', 'evidencias')
      .leftJoinAndSelect('evidencias.estadoOrden', 'evidenciasEstadoOrden')
      .leftJoinAndSelect('order.historialEstados', 'historialEstados')
      .leftJoinAndSelect('historialEstados.estadoOrden', 'historialEstadoOrden')
      .leftJoinAndSelect('order.casillero', 'casillero')
      .where('TRIM(order.workOrderNumber) = :workOrderNumber', { workOrderNumber: workOrderNumber.trim() })
      .andWhere('order.estado = true')
      .andWhere('order.deletedAt IS NULL');

    if (hasCedula) {
      orderQuery.andWhere('TRIM(client.cedula) = :cedula', { cedula: cedula.trim() });
    }

    orderQuery.orderBy('historialEstados.fechaCambio', 'ASC')
      .addOrderBy('evidencias.fechaSubida', 'DESC');

    const order = await orderQuery.getOne();

    if (!order) {
      throw new NotFoundException('No se encontró ninguna orden de servicio activa con los datos ingresados.');
    }

    // Resolver URLs firmadas de evidencias fotográficas para visualización pública segura
    if (order.evidencias && order.evidencias.length > 0) {
      await Promise.all(
        order.evidencias.map(async (ev) => {
          if (ev.storageKey) {
            try {
              ev.archivoUrl = await this.storageService.getPresignedUrl(ev.storageKey);
            } catch (err) {
              this.logger.warn(`Error resolviendo URL firmada para evidencia ${ev.id}: ${err.message}`);
            }
          }
        }),
      );
    }

    // Validación de credencial privada si fue proporcionada
    let tokenValido = false;
    let tokenMensaje = '';
    let tokenBloqueado = false;

    if (token && token.trim() !== '') {
      const ahora = new Date();
      if (order.tokenAccesoBloqueadoHasta && new Date(order.tokenAccesoBloqueadoHasta) > ahora) {
        tokenBloqueado = true;
        tokenMensaje = 'Credencial bloqueada temporalmente por demasiados intentos fallidos. Intente más tarde o acérquese a recepción.';
      } else {
        const inputHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
        if (order.tokenAccesoRevocado) {
          tokenMensaje = 'Esta credencial privada ha sido revocada.';
        } else if (order.tokenAccesoExpiracion && new Date(order.tokenAccesoExpiracion) < ahora) {
          tokenMensaje = 'Esta credencial privada ha expirado.';
        } else if (order.tokenAccesoHash && inputHash === order.tokenAccesoHash) {
          tokenValido = true;
          tokenMensaje = 'Credencial privada verificada correctamente.';
          if (order.tokenAccesoIntentosFallidos > 0) {
            await this.orderRepository.update(order.id, {
              tokenAccesoIntentosFallidos: 0,
              tokenAccesoBloqueadoHasta: null,
              tokenAccesoUltimoUso: ahora,
            });
          }
        } else {
          const nuevosIntentos = (order.tokenAccesoIntentosFallidos || 0) + 1;
          const bloqueo = nuevosIntentos >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
          await this.orderRepository.update(order.id, {
            tokenAccesoIntentosFallidos: nuevosIntentos,
            tokenAccesoBloqueadoHasta: bloqueo,
          });
          tokenMensaje = nuevosIntentos >= 5
            ? 'Demasiados intentos fallidos. Credencial bloqueada temporalmente por 15 minutos.'
            : `Credencial privada no coincide (${5 - nuevosIntentos} intentos restantes).`;
        }
      }
    }

    return {
      id: order.id,
      workOrderNumber: order.workOrderNumber,
      tipoOrden: order.tipoOrden,
      problemaReportado: order.problemaReportado,
      fechaPrometidaEntrega: order.fechaPrometidaEntrega,
      accesorios: order.accesorios || [],
      esperaRepuesto: order.esperaRepuesto || false,
      tiempoEstimadoReparacion: order.tiempoEstimadoReparacion || 0,
      casillero: order.casillero ? { codigo: order.casillero.codigo } : null,
      tecnico: order.technician ? { nombre: `${order.technician.nombre} ${order.technician.apellido || ''}`.trim() } : null,
      estado: order.estado,
      createdAt: order.createdAt,
      cliente: {
        nombre: order.client.nombre,
        apellido: order.client.apellido,
        cedula: order.client.cedula,
      },
      equipo: {
        tipo: order.equipo.tipoEquipo?.nombre || 'Equipo',
        marca: order.equipo.marca?.nombre || 'Marca no especificada',
        modelo: order.equipo.modelo?.nombre || 'Modelo no especificado',
        numeroSerie: order.equipo.numeroSerie,
      },
      estadoOrden: {
        id: order.estadoOrden?.id,
        nombre: order.estadoOrden?.nombre || 'Recepción',
      },
      checklistData: order.checklistData || null,
      historial: order.historialEstados?.map((h) => ({
        id: h.id,
        estadoId: h.estadoOrden?.id,
        estadoNombre: h.estadoOrden?.nombre || 'Actualización',
        fecha: h.fechaCambio,
        observaciones: h.observaciones || '',
      })) || [],
      evidencias: order.evidencias?.map((ev) => ({
        id: ev.id,
        url: ev.archivoUrl || null,
        tipoArchivo: ev.tipoArchivo || 'imagen',
        mimeType: ev.mimeType,
        descripcion: ev.descripcion || '',
        fechaSubida: ev.fechaSubida,
        estadoNombre: ev.estadoOrden?.nombre || 'En proceso',
      })) || [],
      presupuesto: order.presupuesto ? {
        id: order.presupuesto.id,
        version: order.presupuesto.version || 1,
        estado: order.presupuesto.estado?.nombre,
        descripcion: order.presupuesto.descripcion,
        total: order.presupuesto.detallesPresupuestoItems?.reduce((sum, item) => sum + (Number(item.cantidad) * Number(item.precioUnitario)), 0) || 0,
        items: order.presupuesto.detallesPresupuestoItems?.map((item) => ({
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          nombre: item.parte?.nombre || 'Item sin nombre',
        })) || [],
      } : null,
      seguridad: {
        requiereCredencial: true,
        tokenValido,
        tokenBloqueado,
        tokenMensaje,
      },
    };
  }

  /**
   * Autorización de presupuesto por cliente verificada mediante credencial privada criptográfica
   */
  async handlePrivatePresupuestoAction(
    dto: AutorizarPresupuestoPrivadoDto,
    ip?: string,
    userAgent?: string,
  ): Promise<{ success: boolean; message: string; hashIntegridad: string; data?: any }> {
    const workorder = dto.workorder;
    const token = dto.token;
    const rawAction = dto.action || dto.decision;
    const autorizanteNombre = dto.autorizanteNombre;
    const autorizanteIdentificacion = dto.autorizanteIdentificacion || dto.autorizanteCedula;
    const autorizanteParentesco = dto.autorizanteParentesco || 'TITULAR';

    if (!workorder || !token || !rawAction || !autorizanteNombre || !autorizanteIdentificacion) {
      throw new BadRequestException('Todos los campos son obligatorios para la autorización verificada');
    }

    let actionUpper = rawAction.toUpperCase();
    if (actionUpper === 'APROBADO') actionUpper = 'ACEPTADO';
    if (!['ACEPTADO', 'RECHAZADO'].includes(actionUpper)) {
      throw new BadRequestException('Acción inválida. Debe ser ACEPTADO o RECHAZADO');
    }

    // 1. Obtener la orden base para validación de seguridad (sin outer joins para evitar restricción de PostgreSQL)
    const orderBase = await this.orderRepository
      .createQueryBuilder('order')
      .addSelect([
        'order.tokenAccesoHash',
        'order.tokenAccesoExpiracion',
        'order.tokenAccesoRevocado',
        'order.tokenAccesoIntentosFallidos',
        'order.tokenAccesoBloqueadoHasta',
      ])
      .where('TRIM(order.workOrderNumber) = :workOrderNumber', { workOrderNumber: workorder.trim() })
      .andWhere('order.estado = true')
      .andWhere('order.deletedAt IS NULL')
      .getOne();

    if (!orderBase) {
      throw new NotFoundException(`No se encontró ninguna orden activa con número ${workorder}`);
    }

    // 2. Verificar limitación de intentos y bloqueo
    const ahora = new Date();
    if (orderBase.tokenAccesoBloqueadoHasta && new Date(orderBase.tokenAccesoBloqueadoHasta) > ahora) {
      throw new HttpException(
        'La credencial de esta orden está bloqueada temporalmente por exceso de intentos fallidos. Intente más tarde o acérquese a recepción.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 3. Validar secreto criptográfico (hash SHA-256)
    const inputHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
    if (!orderBase.tokenAccesoHash || inputHash !== orderBase.tokenAccesoHash) {
      const fallos = (orderBase.tokenAccesoIntentosFallidos || 0) + 1;
      const bloqueo = fallos >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      await this.orderRepository.update(orderBase.id, {
        tokenAccesoIntentosFallidos: fallos,
        tokenAccesoBloqueadoHasta: bloqueo,
      });
      throw new UnauthorizedException('Credencial privada de autorización incorrecta o no válida.');
    }

    if (orderBase.tokenAccesoRevocado) {
      throw new UnauthorizedException('La credencial privada de esta orden ha sido revocada.');
    }

    if (orderBase.tokenAccesoExpiracion && new Date(orderBase.tokenAccesoExpiracion) < ahora) {
      throw new UnauthorizedException('La credencial privada de esta orden ha expirado.');
    }

    // Transacción para garantizar integridad y evitar autorizaciones concurrentes
    return await this.orderRepository.manager.transaction(async (manager) => {
      // Bloqueo pesimista para evitar carreras simultáneas
      await manager
        .createQueryBuilder(Order, 'order')
        .setLock('pessimistic_write')
        .where('order.id = :id', { id: orderBase.id })
        .getOne();

      // Cargar relaciones requeridas para snapshot y validación
      const order = await manager.findOne(Order, {
        where: { id: orderBase.id },
        relations: [
          'client',
          'technician',
          'presupuesto',
          'presupuesto.estado',
          'presupuesto.detallesPresupuestoItems',
          'presupuesto.detallesPresupuestoItems.parte',
        ],
      });
      if (!order) {
        throw new NotFoundException(`No se encontró ninguna orden activa con número ${workorder}`);
      }
      order.tokenAccesoHash = orderBase.tokenAccesoHash;
      order.tokenAccesoExpiracion = orderBase.tokenAccesoExpiracion;
      order.tokenAccesoRevocado = orderBase.tokenAccesoRevocado;
      order.tokenAccesoIntentosFallidos = orderBase.tokenAccesoIntentosFallidos;
      order.tokenAccesoBloqueadoHasta = orderBase.tokenAccesoBloqueadoHasta;

      // 4. Validar presupuesto asignado y estado
      if (!order.presupuesto) {
        throw new BadRequestException('Esta orden no tiene un presupuesto asignado.');
      }

      const estadoPresupuesto = order.presupuesto.estado?.nombre?.toUpperCase();
      if (estadoPresupuesto === 'APROBADO' || estadoPresupuesto === 'RECHAZADO') {
        throw new BadRequestException(`El presupuesto ya ha sido ${estadoPresupuesto.toLowerCase()} previamente.`);
      }

      // 5. Calcular snapshot del presupuesto
      const itemsSnapshot = (order.presupuesto.detallesPresupuestoItems || []).map((it) => ({
        parteId: it.parteId,
        nombre: it.parte?.nombre || 'Item sin nombre',
        cantidad: Number(it.cantidad),
        precioUnitario: Number(it.precioUnitario),
        subtotal: Number(it.cantidad) * Number(it.precioUnitario),
      }));

      const montoTotal = itemsSnapshot.reduce((acc, curr) => acc + curr.subtotal, 0);
      const versionActual = order.presupuesto.version || 1;

      // 6. Generar hash de integridad SHA-256
      const hashIntegridad = crypto
        .createHash('sha256')
        .update(
          `${order.id}|${order.presupuesto.id}|${versionActual}|${montoTotal.toFixed(2)}|${actionUpper}|${autorizanteIdentificacion.trim()}|${ahora.toISOString()}`,
        )
        .digest('hex');

      // 7. Registrar auditoría inmutable en autorizaciones_presupuesto
      const nuevaAutorizacion = manager.create(AutorizacionPresupuesto, {
        presupuestoId: order.presupuesto.id,
        ordenId: order.id,
        versionPresupuesto: versionActual,
        decision: actionUpper === 'ACEPTADO' ? DecisionPresupuesto.APROBADO : DecisionPresupuesto.RECHAZADO,
        modalidad: ModalidadAutorizacion.TOKEN_ODS_PRIVADO,
        montoAprobado: montoTotal,
        alcanceResumen: itemsSnapshot,
        autorizanteNombre: autorizanteNombre.trim(),
        autorizanteIdentificacion: autorizanteIdentificacion.trim(),
        autorizanteParentesco: autorizanteParentesco?.trim() || 'TITULAR',
        ipOrigen: ip || null,
        userAgent: userAgent || null,
        hashIntegridad,
        fechaAutorizacion: ahora,
      });

      await manager.save(AutorizacionPresupuesto, nuevaAutorizacion);

      // 8. Buscar nuevo estado y actualizar presupuesto delegando en presupuestoService
      const targetStateName = actionUpper === 'ACEPTADO' ? 'Aprobado' : 'Rechazado';
      const nuevoEstado = await manager.getRepository('EstadoPresupuesto').findOne({
        where: { nombre: targetStateName },
      });

      if (!nuevoEstado) {
        throw new InternalServerErrorException(`No se encontró el estado de presupuesto [${targetStateName}] en el sistema.`);
      }

      await manager.update('Presupuesto', order.presupuesto.id, {
        estadoId: (nuevoEstado as any).id,
      });

      // 9. Resetear contador de intentos fallidos tras éxito
      await manager.update(Order, order.id, {
        tokenAccesoIntentosFallidos: 0,
        tokenAccesoBloqueadoHasta: null,
        tokenAccesoUltimoUso: ahora,
      });

      this.logger.log(
        `✓ Presupuesto v${versionActual} de orden #${order.workOrderNumber} ${actionUpper} vía TOKEN_ODS_PRIVADO por ${autorizanteNombre} (${autorizanteIdentificacion}). Hash: ${hashIntegridad}`,
      );

      return {
        success: true,
        message: `Presupuesto ${actionUpper === 'ACEPTADO' ? 'aprobado' : 'rechazado'} exitosamente con credencial verificada.`,
        hashIntegridad,
        data: {
          hashIntegridad,
          decision: actionUpper,
          versionPresupuesto: versionActual,
        },
      };
    });
  }

  /**
   * Autorización de presupuesto presencial en mostrador con firma táctil manuscrita
   */
  async handlePresupuestoActionPresencial(
    orderId: number,
    dto: AutorizarPresupuestoPresencialDto,
    operadorId: number,
    ip?: string,
    userAgent?: string,
  ): Promise<{ success: boolean; message: string; documentoOrdenId: number; hashIntegridad: string }> {
    const rawAction = dto.action || dto.decision;
    const autorizanteNombre = dto.autorizanteNombre;
    const autorizanteIdentificacion = dto.autorizanteIdentificacion || dto.autorizanteCedula;
    const autorizanteParentesco = dto.autorizanteParentesco || 'TITULAR';
    const firmaBase64 = dto.firmaBase64;

    if (!rawAction || !autorizanteNombre || !autorizanteIdentificacion || !firmaBase64) {
      throw new BadRequestException('Acción, nombre, identificación del autorizante y firma manuscrita son requeridos');
    }

    let actionUpper = rawAction.toUpperCase();
    if (actionUpper === 'APROBADO') actionUpper = 'ACEPTADO';
    if (!['ACEPTADO', 'RECHAZADO'].includes(actionUpper)) {
      throw new BadRequestException('Acción inválida. Debe ser ACEPTADO o RECHAZADO');
    }

    const order = await this.orderRepository.findOne({
      where: { id: orderId, estado: true, deletedAt: null },
      relations: [
        'client',
        'technician',
        'presupuesto',
        'presupuesto.estado',
        'presupuesto.detallesPresupuestoItems',
        'presupuesto.detallesPresupuestoItems.parte',
      ],
    });

    if (!order) {
      throw new NotFoundException(`Orden #${orderId} no encontrada`);
    }

    if (!order.presupuesto) {
      throw new BadRequestException('Esta orden no cuenta con un presupuesto emitido.');
    }

    const estadoPresupuesto = order.presupuesto.estado?.nombre?.toUpperCase();
    if (estadoPresupuesto === 'APROBADO' || estadoPresupuesto === 'RECHAZADO') {
      throw new BadRequestException(`El presupuesto ya ha sido ${estadoPresupuesto.toLowerCase()} previamente.`);
    }

    // 1. Generar DocumentoOrden formal con firma táctil manuscrita capturada
    const tipoDoc = actionUpper === 'ACEPTADO'
      ? TipoDocumentoOrden.AUTORIZACION_PRESUPUESTO
      : TipoDocumentoOrden.RECHAZO_PRESUPUESTO;

    const docFirmado = await this.documentosOrdenService.registrarFirma(
      orderId,
      {
        tipoDocumento: tipoDoc,
        firmaBase64,
        firmanteNombre: autorizanteNombre.trim(),
        firmanteIdentificacion: autorizanteIdentificacion.trim(),
        terminosAceptados: dto.terminosAceptados !== undefined ? dto.terminosAceptados : true,
        estadoFirma: EstadoFirmaDocumento.FIRMADO,
      },
      operadorId,
      ip,
      userAgent,
    );

    // 2. Snapshot de ítems y cálculo de total
    const itemsSnapshot = (order.presupuesto.detallesPresupuestoItems || []).map((it) => ({
      parteId: it.parteId,
      nombre: it.parte?.nombre || 'Item sin nombre',
      cantidad: Number(it.cantidad),
      precioUnitario: Number(it.precioUnitario),
      subtotal: Number(it.cantidad) * Number(it.precioUnitario),
    }));
    const montoTotal = itemsSnapshot.reduce((acc, curr) => acc + curr.subtotal, 0);
    const versionActual = order.presupuesto.version || 1;
    const ahora = new Date();

    // 3. Hash de integridad criptográfico
    const hashIntegridad = crypto
      .createHash('sha256')
      .update(
        `${order.id}|${order.presupuesto.id}|${versionActual}|${montoTotal.toFixed(2)}|${actionUpper}|${autorizanteIdentificacion.trim()}|${docFirmado.id}|${ahora.toISOString()}`,
      )
      .digest('hex');

    // 4. Registrar en autorizaciones_presupuesto
    const nuevaAut = this.autorizacionRepository.create({
      presupuestoId: order.presupuesto.id,
      ordenId: order.id,
      versionPresupuesto: versionActual,
      decision: actionUpper === 'ACEPTADO' ? DecisionPresupuesto.APROBADO : DecisionPresupuesto.RECHAZADO,
      modalidad: ModalidadAutorizacion.PRESENCIAL_FIRMA,
      montoAprobado: montoTotal,
      alcanceResumen: itemsSnapshot,
      autorizanteNombre: autorizanteNombre.trim(),
      autorizanteIdentificacion: autorizanteIdentificacion.trim(),
      autorizanteParentesco: autorizanteParentesco?.trim() || 'TITULAR',
      documentoOrdenId: docFirmado.id,
      registradoPorId: operadorId,
      ipOrigen: ip || null,
      userAgent: userAgent || null,
      hashIntegridad,
      fechaAutorizacion: ahora,
    });

    await this.autorizacionRepository.save(nuevaAut);

    // 5. Actualizar estado del presupuesto y control de stock
    const targetStateName = actionUpper === 'ACEPTADO' ? 'Aprobado' : 'Rechazado';
    const nuevoEstado = await this.presupuestoRepository.manager.getRepository('EstadoPresupuesto').findOne({
      where: { nombre: targetStateName },
    });

    if (!nuevoEstado) {
      throw new InternalServerErrorException(`No se encontró el estado de presupuesto [${targetStateName}]`);
    }

    await this.presupuestoService.update(order.presupuesto.id, {
      estadoId: (nuevoEstado as any).id,
    });

    this.logger.log(
      `✓ Presupuesto v${versionActual} de orden #${order.workOrderNumber} ${actionUpper} PRESENCIALMENTE con firma táctil por ${autorizanteNombre}. Doc: #${docFirmado.id}, Hash: ${hashIntegridad}`,
    );

    return {
      success: true,
      message: `Presupuesto ${actionUpper === 'ACEPTADO' ? 'aprobado' : 'rechazado'} presencialmente con acta firmada.`,
      documentoOrdenId: docFirmado.id,
      hashIntegridad,
    };
  }

  async regenerarCredencialOrden(orderId: number, operadorId: number): Promise<{ rawSecret: string; expiracion: Date }> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Orden #${orderId} no encontrada`);

    const rawSecret = crypto.randomBytes(16).toString('hex');
    const tokenAccesoHash = crypto.createHash('sha256').update(rawSecret).digest('hex');
    const tokenAccesoExpiracion = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    await this.orderRepository.update(orderId, {
      tokenAccesoHash,
      tokenAccesoExpiracion,
      tokenAccesoRevocado: false,
      tokenAccesoIntentosFallidos: 0,
      tokenAccesoBloqueadoHasta: null,
    });

    this.logger.log(`✓ Credencial privada regenerada para orden #${order.workOrderNumber} por operador #${operadorId}`);
    return { rawSecret, expiracion: tokenAccesoExpiracion };
  }

  async revocarCredencialOrden(orderId: number, operadorId: number): Promise<{ message: string }> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Orden #${orderId} no encontrada`);

    await this.orderRepository.update(orderId, {
      tokenAccesoRevocado: true,
    });

    this.logger.log(`✓ Credencial privada revocada para orden #${order.workOrderNumber} por operador #${operadorId}`);
    return { message: `Credencial privada para orden #${order.workOrderNumber} revocada exitosamente.` };
  }

  async getTechniciansAvailability(): Promise<any[]> {
    const techs = await this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.userRoles', 'userRoles')
      .leftJoinAndSelect('userRoles.rol', 'rol')
      .where('rol.slug = :role', { role: 'tech' })
      .andWhere('user.estado = :estado', { estado: true })
      .orderBy('user.nombre', 'ASC')
      .getMany();

    const availability = [];

    for (const tech of techs) {
      const activeOrders = await this.orderRepository.createQueryBuilder('order')
        .leftJoinAndSelect('order.estadoOrden', 'estadoOrden')
        .where('order.technicianId = :techId', { techId: tech.id })
        .andWhere('order.estado = :estado', { estado: true })
        .andWhere('order.deletedAt IS NULL')
        .andWhere('LOWER(estadoOrden.nombre) NOT IN (:...excludedStates)', {
          excludedStates: ['archivados', 'entrega', 'entregado']
        })
        .getMany();

      const totalActive = activeOrders.length;
      const waitingForParts = activeOrders.filter(o => o.esperaRepuesto).length;
      const workingActive = totalActive - waitingForParts;

      let nextAvailableDate: Date | null = null;
      let estimationReason = '';

      const workingActiveOrders = activeOrders.filter(o => !o.esperaRepuesto);

      if (totalActive === 0) {
        estimationReason = 'Disponibilidad inmediata (Sin órdenes asignadas)';
      } else if (workingActive === 0 && waitingForParts > 0) {
        estimationReason = `Disponibilidad inmediata (Órdenes asignadas en espera de repuestos: ${waitingForParts})`;
      } else {
        const totalHours = workingActiveOrders.reduce((sum, o) => {
          const hours = o.tiempoEstimadoReparacion > 0 ? o.tiempoEstimadoReparacion : 3;
          return sum + hours;
        }, 0);

        const workingHoursPerDay = 8;
        const daysToEstimate = Math.ceil(totalHours / workingHoursPerDay);
        const estimatedDate = new Date();
        estimatedDate.setDate(estimatedDate.getDate() + daysToEstimate);
        nextAvailableDate = estimatedDate;
        estimationReason = `Estimado: ${totalHours} horas de trabajo (${daysToEstimate} días aprox.)`;
      }

      availability.push({
        technicianId: tech.id,
        nombreCompleto: `${tech.nombre} ${tech.apellido}`,
        totalActive,
        waitingForParts,
        workingActive,
        nextAvailableDate,
        estimationReason
      });
    }

    return availability;
  }
}

