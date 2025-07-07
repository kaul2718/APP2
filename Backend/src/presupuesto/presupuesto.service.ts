import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Presupuesto } from './entities/presupuesto.entity';
import { CreatePresupuestoDto } from './dto/create-presupuesto.dto';
import { UpdatePresupuestoDto } from './dto/update-presupuesto.dto';
import { Order } from 'src/orders/entities/order.entity';
import { EstadoPresupuesto } from '../estado-presupuesto/entities/estado-presupuesto.entity';
import { DetalleRepuestos } from 'src/detalle-repuestos/entities/detalle-repuesto.entity';
import { Inventario } from 'src/inventario/entities/inventario.entity';
import { Repuesto } from 'src/repuestos/entities/repuesto.entity';
import { DetalleManoObra } from 'src/detalle-mano-obra/entities/detalle-mano-obra.entity';
import { TipoNotificacion } from 'src/tipo-notificacion/entities/tipo-notificacion.entity';
import { NotificacionService } from 'src/notificacion/notificacion.service';

@Injectable()
export class PresupuestoService {
  constructor(
    @InjectRepository(Presupuesto)
    private readonly presupuestoRepository: Repository<Presupuesto>,

    @InjectRepository(Order)
    private readonly ordenRepository: Repository<Order>,

    @InjectRepository(EstadoPresupuesto)
    private readonly estadoPresupuestoRepository: Repository<EstadoPresupuesto>,

    @InjectRepository(DetalleRepuestos)
    private readonly detalleRepuestosRepository: Repository<DetalleRepuestos>,

    @InjectRepository(Inventario)
    private readonly inventarioRepository: Repository<Inventario>,

    @InjectRepository(Repuesto)
    private readonly repuestoRepository: Repository<Repuesto>,

    @InjectRepository(TipoNotificacion)
    private readonly tipoNotificacionRepository: Repository<TipoNotificacion>,

    private readonly dataSource: DataSource, // 👈 Agregado

    private readonly notificacionService: NotificacionService, // Inyectamos el servicio de notificaciones

  ) { }

  async create(createDto: CreatePresupuestoDto): Promise<Presupuesto> {
    const { ordenId, estadoId, descripcion } = createDto;

    const orden = await this.ordenRepository.findOne({ where: { id: ordenId } });
    if (!orden) throw new NotFoundException(`Orden con ID ${ordenId} no encontrada.`);

    // 👇 Aquí validas si ya hay un presupuesto para esa orden
    const existente = await this.presupuestoRepository.findOne({
      where: { ordenId },
    });
    if (existente) {
      throw new BadRequestException('Ya existe un presupuesto para esta orden.');
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
      throw new InternalServerErrorException(`Error creando presupuesto: ${error.message}`);
    }
  }


  async findAll(): Promise<Presupuesto[]> {
    return this.presupuestoRepository.find({
      relations: ['orden', 'estado'],
    });
  }

  async findOne(id: number): Promise<Presupuesto> {
    const presupuesto = await this.presupuestoRepository.findOne({
      where: { id },
      relations: ['orden', 'estado'],
    });
    if (!presupuesto) throw new NotFoundException(`Presupuesto con ID ${id} no encontrado.`);
    return presupuesto;
  }


  async update(id: number, updateDto: UpdatePresupuestoDto): Promise<Presupuesto> {
    const presupuesto = await this.presupuestoRepository.findOne({ where: { id }, relations: ['orden', 'orden.client', 'estado'] });
    if (!presupuesto) throw new NotFoundException(`Presupuesto con ID ${id} no encontrado.`);

    if (updateDto.ordenId) {
      const orden = await this.ordenRepository.findOne({ where: { id: updateDto.ordenId } });
      if (!orden) throw new NotFoundException(`Orden con ID ${updateDto.ordenId} no encontrada.`);
    }

    if (updateDto.estadoId) {
      const nuevoEstado = await this.estadoPresupuestoRepository.findOne({ where: { id: updateDto.estadoId } });
      if (!nuevoEstado) throw new NotFoundException(`EstadoPresupuesto con ID ${updateDto.estadoId} no encontrado.`);

      // Detectar si cambio de estado para aplicar lógica inventario y crear notificación
      if (presupuesto.estadoId !== updateDto.estadoId) {
        // Ajustes en inventario según el estado
        if (nuevoEstado.nombre.toLowerCase() === 'aprobado') {
          await this.descontarInventario(presupuesto.id);
        } else if (['rechazado', 'cancelado'].includes(nuevoEstado.nombre.toLowerCase())) {
          await this.revertirInventario(presupuesto.id);
        }

        // Crear notificación para el cambio de estado presupuesto
        // Buscar tipoNotificacion según el nombre del estado (puedes ajustar los nombres para que coincidan)
        const tipoNotificacion = await this.tipoNotificacionRepository.findOne({
          where: { nombre: nuevoEstado.nombre }
        });

        if (tipoNotificacion) {
          await this.notificacionService.create({
            usuarioId: presupuesto.orden.client.id,  // Se notifica al cliente
            ordenServicioId: presupuesto.orden.id,
            tipoId: tipoNotificacion.id,
            mensaje: `El estado del presupuesto ha cambiado a: ${nuevoEstado.nombre}`,
            leido: false,
          });
        }
      }
    }

    Object.assign(presupuesto, updateDto);
    await this.presupuestoRepository.save(presupuesto);

    const presupuestoActualizado = await this.presupuestoRepository.findOne({
      where: { id },
      relations: ['orden', 'estado'],
    });

    return presupuestoActualizado;
  }


  async remove(id: number): Promise<{ message: string }> {
    const presupuesto = await this.presupuestoRepository.findOne({ where: { id } });
    if (!presupuesto) throw new NotFoundException(`Presupuesto con ID ${id} no encontrado.`);

    await this.presupuestoRepository.remove(presupuesto);
    return { message: `Presupuesto con ID ${id} eliminado.` };
  }

  // ✅ Lógica: aplicar cambios al inventario si se aprueba
  private async descontarInventario(presupuestoId: number) {
    const detalles = await this.detalleRepuestosRepository.find({
      where: { presupuestoId },
      relations: ['repuesto'],
    });

    for (const detalle of detalles) {
      const inventario = await this.inventarioRepository.findOne({
        where: {
          parteId: detalle.repuesto.parteId,
          deletedAt: null,
          estado: true,
        },
      });

      if (!inventario)
        throw new NotFoundException(`Inventario para parte ${detalle.repuesto.parteId} no encontrado.`);

      if (inventario.cantidad < detalle.cantidad)
        throw new BadRequestException(`Stock insuficiente para parte ${detalle.repuesto.parteId}`);

      inventario.cantidad -= detalle.cantidad;
      await this.inventarioRepository.save(inventario);
    }
  }


  // ✅ Lógica: restaurar stock si se rechaza/cancela
  private async revertirInventario(presupuestoId: number) {
    const detalles = await this.detalleRepuestosRepository.find({
      where: { presupuestoId },
      relations: ['repuesto'],
    });

    for (const detalle of detalles) {
      const inventario = await this.inventarioRepository.findOne({
        where: {
          parteId: detalle.repuesto.parteId,
          deletedAt: null,
          estado: true,
        },
      });

      if (inventario) {
        inventario.cantidad += detalle.cantidad;
        await this.inventarioRepository.save(inventario);
      }

      detalle.comentario = 'Detalle anulado por rechazo/cancelación de presupuesto';
      await this.detalleRepuestosRepository.save(detalle);
    }
  }

  //RESUMEN DE COSTOS
  async getResumenPresupuesto(id: number) {
    // Primero obtén el presupuesto con la relación orden
    const presupuesto = await this.presupuestoRepository.findOne({
      where: { id },
      relations: ['orden'], // carga la orden relacionada
    });
    if (!presupuesto) throw new NotFoundException('Presupuesto no encontrado');

    // Obtén los detalles de mano de obra filtrando por presupuestoId
    const detallesManoObra = await this.dataSource
      .getRepository(DetalleManoObra)
      .find({
        where: { presupuestoId: id },
        relations: ['tipoManoObra'],
      });

    // Obtén los detalles de repuestos filtrando por orderId (orden relacionada)
    const detallesRepuestos = await this.dataSource
      .getRepository(DetalleRepuestos)
      .find({
        where: { presupuestoId: presupuesto.id },
        relations: ['repuesto'],
      });

    // Calcula costos
    const costoManoObra = detallesManoObra.reduce((sum, d) => sum + Number(d.costoTotal), 0);
    const costoRepuestos = detallesRepuestos.reduce(
      (sum, d) => sum + Number(d.precioUnitario) * d.cantidad,
      0,
    );

    // Arma resumen
    const resumen = {
      presupuestoId: presupuesto.id,
      descripcion: presupuesto.descripcion,
      fechaEmision: presupuesto.fechaEmision,
      orden: {
        numeroOrden: presupuesto.orden.workOrderNumber,
        clienteId: presupuesto.orden.clientId,
        equipoId: presupuesto.orden.equipoId,
      },
      detalleManoObra: detallesManoObra.map((d) => ({
        tipo: d.tipoManoObra?.nombre,
        cantidad: d.cantidad,
        costoUnitario: d.costoUnitario,
        costoTotal: d.costoTotal,
      })),
      detalleRepuestos: detallesRepuestos.map((d) => ({
        nombre: d.repuesto?.nombre,
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario,
        subtotal: d.cantidad * Number(d.precioUnitario),
      })),
      costoManoObra,
      costoRepuestos,
      costoTotal: costoManoObra + costoRepuestos,
    };

    return resumen;
  }

}
