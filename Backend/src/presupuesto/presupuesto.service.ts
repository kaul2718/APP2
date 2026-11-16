import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, IsNull } from 'typeorm';
import * as crypto from 'crypto';
import { Presupuesto } from './entities/presupuesto.entity';
import {
  AutorizacionPresupuesto,
  DecisionPresupuesto,
  ModalidadAutorizacion,
} from './entities/autorizacion-presupuesto.entity';
import { CreatePresupuestoDto } from './dto/create-presupuesto.dto';
import { UpdatePresupuestoDto } from './dto/update-presupuesto.dto';
import { Order } from 'src/orders/entities/order.entity';
import { EstadoPresupuesto } from '../estado-presupuesto/entities/estado-presupuesto.entity';
import { DetallePresupuestoItem } from 'src/detalle-presupuesto-item/entities/detalle-presupuesto-item.entity';
import { Parte } from 'src/parte/entities/parte.entity';
import { User } from 'src/users/entities/user.entity';
import { HistorialEstadoOrden } from 'src/historial-estado-orden/entities/historial-estado-orden.entity';
import { NotificacionService } from '../notificacion/notificacion.service';

export function formatModalidadLabel(modalidad?: ModalidadAutorizacion | string): string {
  switch (modalidad) {
    case ModalidadAutorizacion.PRESENCIAL_FIRMA:
      return 'Presencial con firma del cliente';
    case ModalidadAutorizacion.CONFIRMACION_TELEFONICA:
      return 'Confirmación telefónica';
    case ModalidadAutorizacion.CONFIRMACION_MENSAJE_CORREO:
      return 'Confirmación por mensaje o correo';
    case ModalidadAutorizacion.AUTORIZACION_INTERNA:
      return 'Autorización interna del establecimiento';
    case ModalidadAutorizacion.TOKEN_ODS_PRIVADO:
      return 'Enlace / QR privado del cliente';
    case ModalidadAutorizacion.PORTAL_CLIENTE_AUTENTICADO:
      return 'Portal del cliente autenticado';
    default:
      return modalidad || 'No especificada';
  }
}

@Injectable()
export class PresupuestoService {
  constructor(
    @InjectRepository(Presupuesto)
    private readonly presupuestoRepository: Repository<Presupuesto>,

    @InjectRepository(Order)
    private readonly ordenRepository: Repository<Order>,

    @InjectRepository(EstadoPresupuesto)
    private readonly estadoPresupuestoRepository: Repository<EstadoPresupuesto>,

    @InjectRepository(DetallePresupuestoItem)
    private readonly detallePresupuestoItemsRepository: Repository<DetallePresupuestoItem>,

    @InjectRepository(Parte)
    private readonly parteRepository: Repository<Parte>,

    @InjectRepository(AutorizacionPresupuesto)
    private readonly autorizacionRepository: Repository<AutorizacionPresupuesto>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(HistorialEstadoOrden)
    private readonly historialRepository: Repository<HistorialEstadoOrden>,

    private readonly dataSource: DataSource,
    private readonly notificacionService: NotificacionService,
  ) { }

  async create(createDto: CreatePresupuestoDto): Promise<Presupuesto> {
    const { ordenId, estadoId, descripcion } = createDto;

    const orden = await this.ordenRepository.findOne({ where: { id: ordenId } });
    if (!orden) throw new NotFoundException(`Orden con ID ${ordenId} no encontrada.`);

    const existente = await this.presupuestoRepository.findOne({
      where: { ordenId, deletedAt: null },
    });
    if (existente) {
      throw new BadRequestException('Ya existe un presupuesto activo para esta orden.');
    }

    const estado = await this.estadoPresupuestoRepository.findOne({ where: { id: estadoId } });
    if (!estado) throw new NotFoundException(`EstadoPresupuesto con ID ${estadoId} no encontrado.`);

    const presupuesto = this.presupuestoRepository.create({
      ordenId,
      estadoId,
      descripcion,
      fechaEmision: new Date(),
    });

    try {
      return await this.presupuestoRepository.save(presupuesto);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new InternalServerErrorException(`Error creando presupuesto: ${message}`);
    }
  }

  async findAll(includeDeleted = false): Promise<Presupuesto[]> {
    const query = this.presupuestoRepository.createQueryBuilder('presupuesto')
      .leftJoinAndSelect('presupuesto.orden', 'orden')
      .leftJoinAndSelect('orden.client', 'client')
      .leftJoinAndSelect('orden.equipo', 'equipo')
      .leftJoinAndSelect('equipo.tipoEquipo', 'tipoEquipo')
      .leftJoinAndSelect('equipo.marca', 'marca')
      .leftJoinAndSelect('equipo.modelo', 'modelo')
      .leftJoinAndSelect('presupuesto.estado', 'estado')
      .leftJoinAndSelect('presupuesto.detallesPresupuestoItems', 'detallesPresupuestoItems')
      .leftJoinAndSelect('detallesPresupuestoItems.parte', 'parteDetalle')
      .leftJoinAndSelect('presupuesto.autorizaciones', 'autorizaciones')
      .leftJoinAndSelect('autorizaciones.registradoPor', 'registradoPor')
      .leftJoinAndSelect('registradoPor.userRoles', 'userRolesAuth')
      .leftJoinAndSelect('userRolesAuth.rol', 'rolAuth')
      .orderBy('presupuesto.fechaEmision', 'DESC');

    if (!includeDeleted) {
      query.where('presupuesto.deletedAt IS NULL');
    }

    return query.getMany();
  }

  async findOne(id: number, includeDeleted = false): Promise<Presupuesto> {
    const query = this.presupuestoRepository.createQueryBuilder('presupuesto')
      .leftJoinAndSelect('presupuesto.orden', 'orden')
      .leftJoinAndSelect('orden.client', 'client')
      .leftJoinAndSelect('orden.equipo', 'equipo')
      .leftJoinAndSelect('equipo.tipoEquipo', 'tipoEquipo')
      .leftJoinAndSelect('equipo.marca', 'marca')
      .leftJoinAndSelect('equipo.modelo', 'modelo')
      .leftJoinAndSelect('presupuesto.estado', 'estado')
      .leftJoinAndSelect('presupuesto.detallesPresupuestoItems', 'detallesPresupuestoItems')
      .leftJoinAndSelect('detallesPresupuestoItems.parte', 'parteDetalle')
      .leftJoinAndSelect('presupuesto.autorizaciones', 'autorizaciones')
      .leftJoinAndSelect('autorizaciones.registradoPor', 'registradoPor')
      .leftJoinAndSelect('registradoPor.userRoles', 'userRolesAuth')
      .leftJoinAndSelect('userRolesAuth.rol', 'rolAuth')
      .where('presupuesto.id = :id', { id });

    if (!includeDeleted) {
      query.andWhere('presupuesto.deletedAt IS NULL');
    }

    const presupuesto = await query.getOne();

    if (!presupuesto) {
      throw new NotFoundException(`Presupuesto con ID ${id} no encontrado.`);
    }

    return presupuesto;
  }

  async update(
    id: number,
    updateDto: UpdatePresupuestoDto,
    operadorId?: number,
    ip?: string,
    userAgent?: string,
  ): Promise<Presupuesto> {
    const presupuesto = await this.presupuestoRepository.findOne({
      where: { id },
      relations: ['orden', 'orden.client', 'orden.technician', 'orden.estadoOrden', 'estado', 'detallesPresupuestoItems'],
    });

    if (!presupuesto) {
      throw new NotFoundException(`Presupuesto con ID ${id} no encontrado.`);
    }

    if (updateDto.ordenId && updateDto.ordenId !== presupuesto.ordenId) {
      const orden = await this.ordenRepository.findOne({
        where: { id: updateDto.ordenId },
        relations: ['client'],
      });

      if (!orden) throw new NotFoundException(`Orden con ID ${updateDto.ordenId} no encontrada.`);

      const existente = await this.presupuestoRepository.findOne({
        where: { ordenId: updateDto.ordenId, deletedAt: IsNull() },
      });

      if (existente && existente.id !== id) {
        throw new BadRequestException('Ya existe un presupuesto activo para esta orden.');
      }

      presupuesto.ordenId = updateDto.ordenId;
      presupuesto.orden = orden;
    }

    if (updateDto.estadoId) {
      const nuevoEstado = await this.estadoPresupuestoRepository.findOne({ where: { id: updateDto.estadoId } });
      if (!nuevoEstado) throw new NotFoundException(`Estado con ID ${updateDto.estadoId} no encontrado.`);

      const estadoAnteriorNombre = presupuesto.estado?.nombre?.toLowerCase() || '';
      const nuevoEstadoNombre = nuevoEstado.nombre.toLowerCase();

      if (presupuesto.estadoId !== updateDto.estadoId) {
        if (nuevoEstadoNombre === 'aprobado' || nuevoEstadoNombre === 'rechazado') {
          let autorizacion = await this.autorizacionRepository.findOne({
            where: {
              presupuestoId: presupuesto.id,
              versionPresupuesto: presupuesto.version,
            },
            order: { id: 'DESC' },
          });

          if (!autorizacion) {
            if (!operadorId) {
              throw new BadRequestException(
                `No se puede marcar el presupuesto como '${nuevoEstado.nombre}' sin una autorización verificable previa para la versión ${presupuesto.version}.`
              );
            }

            const operador = await this.userRepository.findOne({
              where: { id: operadorId },
              relations: ['userRoles', 'userRoles.rol', 'userRoles.rol.rolePermissions', 'userRoles.rol.rolePermissions.permission'],
            });
            if (!operador) {
              throw new ForbiddenException('Usuario responsable no encontrado.');
            }

            const userRoleSlugs = (operador.userRoles || []).map((ur: any) => ur.rol?.slug).filter(Boolean);
            const isAuthorizedRole = userRoleSlugs.some((slug: string) => ['admin', 'recep', 'tech'].includes(slug));
            if (!isAuthorizedRole) {
              throw new ForbiddenException('No cuenta con permisos para aprobar o rechazar presupuestos.');
            }

            const modalidadElegida = updateDto.modalidad || ModalidadAutorizacion.AUTORIZACION_INTERNA;
            if (modalidadElegida === ModalidadAutorizacion.PRESENCIAL_FIRMA) {
              throw new BadRequestException(
                'La modalidad presencial con firma requiere capturar la firma manuscrita del cliente.',
              );
            }

            const decisionEnum =
              nuevoEstadoNombre === 'aprobado' ? DecisionPresupuesto.APROBADO : DecisionPresupuesto.RECHAZADO;
            const operadorNombre = `${operador.nombre || ''} ${operador.apellido || ''}`.trim() || 'Personal Autorizado';
            const client = presupuesto.orden?.client;
            const clienteNombre = client ? `${client.nombre || ''} ${client.apellido || ''}`.trim() : 'Cliente Titular';

            const esInterna = modalidadElegida === ModalidadAutorizacion.AUTORIZACION_INTERNA;
            const autorizanteNombre = esInterna ? `Autorización Interna (${operadorNombre})` : (clienteNombre || operadorNombre);
            const autorizanteIdentificacion = esInterna
              ? (operador.cedula || 'INTERNO').slice(0, 20)
              : (client?.cedula || operador.cedula || 'S/N').slice(0, 20);
            const autorizanteParentesco = esInterna ? 'INTERNO_ESTABLECIMIENTO' : 'TITULAR (CONFIRMACIÓN REMOTA)';
            const observacionTexto = updateDto.observaciones?.trim() || null;

            const itemsActivos = (presupuesto.detallesPresupuestoItems || []).filter(
              (item) => item.estado !== false && !item.deletedAt,
            );
            const montoTotal = itemsActivos.reduce(
              (acc, item) => acc + Number(item.subtotal || Number(item.precioUnitario) * item.cantidad || 0),
              0,
            );

            const hashPayload = JSON.stringify({
              ordenId: presupuesto.ordenId,
              presupuestoId: presupuesto.id,
              version: presupuesto.version,
              decision: decisionEnum,
              modalidad: modalidadElegida,
              montoTotal,
              operadorId,
              observaciones: observacionTexto,
              timestamp: new Date().toISOString(),
            });
            const hashIntegridad = crypto.createHash('sha256').update(hashPayload).digest('hex');

            autorizacion = this.autorizacionRepository.create({
              presupuestoId: presupuesto.id,
              ordenId: presupuesto.ordenId,
              versionPresupuesto: presupuesto.version || 1,
              decision: decisionEnum,
              modalidad: modalidadElegida,
              montoAprobado: montoTotal,
              alcanceResumen: itemsActivos.map((i) => ({
                id: i.id,
                cantidad: i.cantidad,
                precioUnitario: Number(i.precioUnitario),
                subtotal: Number(i.subtotal),
              })),
              autorizanteNombre: autorizanteNombre.slice(0, 150),
              autorizanteIdentificacion,
              autorizanteParentesco,
              observaciones: observacionTexto,
              documentoOrdenId: null,
              registradoPorId: operadorId,
              ipOrigen: ip || null,
              userAgent: userAgent || null,
              hashIntegridad,
            });
            await this.autorizacionRepository.save(autorizacion);

            if (presupuesto.orden?.estadoOrden?.id || (presupuesto.orden as any)?.estadoOrdenId) {
              const estadoOrdenId = presupuesto.orden.estadoOrden?.id || (presupuesto.orden as any).estadoOrdenId;
              const etiquetaDecision = decisionEnum === DecisionPresupuesto.APROBADO ? 'Aprobado' : 'Rechazado';
              const etiquetaModalidad = formatModalidadLabel(modalidadElegida);
              const obsHistorial = `Presupuesto v${presupuesto.version || 1} ${etiquetaDecision} — Modalidad: ${etiquetaModalidad}${
                observacionTexto ? ` | Obs: ${observacionTexto}` : ''
              }`;
              const regHist = this.historialRepository.create({
                orden: { id: presupuesto.ordenId } as any,
                estadoOrden: { id: estadoOrdenId } as any,
                usuario: { id: operadorId } as any,
                observaciones: obsHistorial,
                fechaCambio: new Date(),
              });
              await this.historialRepository.save(regHist);
            }
          }
        }

        if (nuevoEstadoNombre === 'aprobado' && estadoAnteriorNombre !== 'aprobado') {
          await this.descontarInventario(presupuesto.id);
        }
        else if (nuevoEstadoNombre !== 'aprobado' && estadoAnteriorNombre === 'aprobado') {
          await this.revertirInventario(presupuesto.id);
        }

        // Enviar notificaciones en tiempo real al cambiar el estado del presupuesto
        if (presupuesto.orden) {
          const client = presupuesto.orden.client;
          const technician = presupuesto.orden.technician;
          const orderNum = presupuesto.orden.workOrderNumber;

          if (client) {
            await this.notificacionService.notificarPresupuesto(presupuesto.orden.id, client.id, orderNum, nuevoEstado.nombre);
          }
          if (technician) {
            await this.notificacionService.notificarPresupuesto(presupuesto.orden.id, technician.id, orderNum, nuevoEstado.nombre);
          }
        }
      }

      presupuesto.estadoId = updateDto.estadoId;
      presupuesto.estado = nuevoEstado;
    }

    if (updateDto.descripcion !== undefined) {
      presupuesto.descripcion = updateDto.descripcion;
    }

    await this.presupuestoRepository.save(presupuesto);

    return this.findOne(id);
  }

  async remove(id: number) {
    const presupuesto = await this.presupuestoRepository.findOne({
      where: { id },
      relations: ['estado'],
      withDeleted: true,
    });

    if (!presupuesto) return null;
    if (presupuesto.deletedAt) return false;

    // Si el presupuesto estaba aprobado, devolvemos el stock al almacén antes de eliminarlo
    if (presupuesto.estado?.nombre?.toLowerCase() === 'aprobado') {
      await this.revertirInventario(id);
    }

    await this.presupuestoRepository.softDelete(id);
    return true;
  }

  async restore(id: number): Promise<{ message: string }> {
    const presupuesto = await this.findOne(id, true);
    if (!presupuesto.deletedAt) throw new BadRequestException('El presupuesto no está eliminado');
    await this.presupuestoRepository.restore(id);
    return { message: `Presupuesto con ID ${id} restaurado.` };
  }

  async findAllPaginated(
    page: any,
    limit: any,
    search?: string,
    includeDeleted = false,
  ): Promise<{ data: Presupuesto[]; total: number }> {
    const limitNum = Number(limit) || 10;
    const pageNum = Number(page) || 1;
    const skip = (pageNum - 1) * limitNum;

    const query = this.presupuestoRepository.createQueryBuilder('presupuesto')
      .leftJoinAndSelect('presupuesto.orden', 'orden')
      .leftJoinAndSelect('orden.client', 'client')
      .leftJoinAndSelect('orden.equipo', 'equipo')
      .leftJoinAndSelect('equipo.tipoEquipo', 'tipoEquipo')
      .leftJoinAndSelect('equipo.marca', 'marca')
      .leftJoinAndSelect('equipo.modelo', 'modelo')
      .leftJoinAndSelect('presupuesto.estado', 'estado')
      .leftJoinAndSelect('presupuesto.autorizaciones', 'autorizaciones')
      .leftJoinAndSelect('autorizaciones.registradoPor', 'registradoPor')
      .leftJoinAndSelect('registradoPor.userRoles', 'userRolesAuth')
      .leftJoinAndSelect('userRolesAuth.rol', 'rolAuth');

    if (search) {
      query.where('LOWER(presupuesto.descripcion) LIKE LOWER(:search)', { search: `%${search}%` });
    }

    if (!includeDeleted) query.andWhere('presupuesto.deletedAt IS NULL');

    query.skip(skip).take(limitNum).orderBy('presupuesto.fechaEmision', 'DESC');

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  public async descontarInventario(presupuestoId: number) {
    const detalles = await this.detallePresupuestoItemsRepository.find({
      where: { presupuestoId, estado: true }, // Solo descontamos stock para detalles activos
      relations: ['parte'],
    });

    for (const detalle of detalles) {
      const parteId = detalle.parteId ?? detalle.parte?.id;
      if (!parteId) throw new NotFoundException(`No se pudo resolver la parte asociada al detalle ${detalle.id}.`);

      const parte = await this.parteRepository.findOne({ where: { id: parteId } });
      if (!parte) throw new NotFoundException(`Producto de almacén con ID ${parteId} no encontrado.`);

      // Si es un servicio, omitimos el descuento y control de stock
      if (parte.unidadMedida === 'Servicio') continue;

      if (Number(parte.stock) < detalle.cantidad)
        throw new BadRequestException(`Existencias insuficientes para ${parte.nombre}. Disponible: ${parte.stock}`);

      parte.stock = Number(parte.stock) - detalle.cantidad;
      await this.parteRepository.save(parte);

      // Lanzar alerta de stock bajo si aplica
      await this.notificacionService.checkAndNotificarStockBajo(parte.id);
    }
  }

  public async revertirInventario(presupuestoId: number) {
    const detalles = await this.detallePresupuestoItemsRepository.find({
      where: { presupuestoId, estado: true }, // Solo devolvemos stock para detalles activos que no hayan sido eliminados previamente
      relations: ['parte'],
    });

    for (const detalle of detalles) {
      const parteId = detalle.parteId ?? detalle.parte?.id;
      if (parteId) {
        const parte = await this.parteRepository.findOne({ where: { id: parteId } });
        // Solo revertir stock si no es un servicio
        if (parte && parte.unidadMedida !== 'Servicio') {
          parte.stock = Number(parte.stock) + detalle.cantidad;
          await this.parteRepository.save(parte);
        }
      }
      detalle.comentario = 'Stock devuelto por anulación de presupuesto';
      await this.detallePresupuestoItemsRepository.save(detalle);
    }
  }

  async getResumenPresupuesto(id: number) {
    const presupuesto = await this.presupuestoRepository.findOne({
      where: { id, deletedAt: null },
      relations: ['orden', 'estado', 'autorizaciones', 'autorizaciones.registradoPor', 'autorizaciones.registradoPor.userRoles', 'autorizaciones.registradoPor.userRoles.rol'],
    });
    if (!presupuesto) throw new NotFoundException('Presupuesto no encontrado');

    const todosLosItems = await this.detallePresupuestoItemsRepository.find({
      where: { presupuestoId: presupuesto.id },
      relations: ['parte'],
    });

    // Dividimos en mano de obra (Servicios) y repuestos (Productos)
    const detallesManoObra = todosLosItems.filter(item => item.parte?.unidadMedida === 'Servicio');
    const detallesRepuestos = todosLosItems.filter(item => item.parte?.unidadMedida !== 'Servicio');

    const costoManoObra = detallesManoObra.reduce((sum, d) => sum + Number(d.precioUnitario) * d.cantidad, 0);
    const costoItems = detallesRepuestos.reduce((sum, d) => sum + Number(d.precioUnitario) * d.cantidad, 0);

    const autorizacionesOrdenadas = [...(presupuesto.autorizaciones || [])].sort(
      (a, b) => Number(b.id) - Number(a.id),
    );
    const ultimaAutorizacion = autorizacionesOrdenadas[0] || null;

    return {
      presupuestoId: presupuesto.id,
      version: presupuesto.version || 1,
      descripcion: presupuesto.descripcion,
      fechaEmision: presupuesto.fechaEmision,
      estado: presupuesto.estado,
      ultimaAutorizacion,
      orden: {
        numeroOrden: presupuesto.orden.workOrderNumber,
        clienteId: presupuesto.orden.clientId,
        equipoId: presupuesto.orden.equipoId,
      },
      // Estructura retrocompatible con el frontend legado
      detalleManoObra: detallesManoObra.map((d) => ({
        id: d.id,
        tipo: d.parte?.nombre || 'Servicio sin nombre',
        cantidad: d.cantidad,
        costoUnitario: Number(d.precioUnitario),
        costoTotal: d.cantidad * Number(d.precioUnitario),
        estado: d.estado,
      })),
      detalleItems: detallesRepuestos.map((d) => ({
        id: d.id,
        nombre: d.parte?.nombre || 'Ítem sin nombre',
        cantidad: d.cantidad,
        precioUnitario: Number(d.precioUnitario),
        subtotal: d.cantidad * Number(d.precioUnitario),
        estado: d.estado,
      })),
      costoManoObra,
      costoItems,
      costoTotal: costoManoObra + costoItems,
    };
  }

  async findByOrderId(orderId: number): Promise<Presupuesto[]> {
    return this.presupuestoRepository.find({
      where: { ordenId: orderId, deletedAt: IsNull() },
      relations: [
        'orden', 'orden.client', 'orden.equipo', 'orden.equipo.tipoEquipo',
        'orden.equipo.marca', 'orden.equipo.modelo', 'estado',
        'detallesPresupuestoItems', 'detallesPresupuestoItems.parte',
        'autorizaciones', 'autorizaciones.registradoPor', 'autorizaciones.registradoPor.userRoles', 'autorizaciones.registradoPor.userRoles.rol',
      ],
      order: { fechaEmision: 'DESC' },
    });
  }
}
