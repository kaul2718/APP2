import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacion } from './entities/notificacion.entity';
import { CreateNotificacionDto } from './dto/create-notificacion.dto';
import { UpdateNotificacionDto } from './dto/update-notificacion.dto';
import { NotificacionGateway } from './notificacion.gateway';
import { Inject, forwardRef } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { Parte } from '../parte/entities/parte.entity';

@Injectable()
export class NotificacionService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Notificacion)
    private readonly notificacionRepository: Repository<Notificacion>,
    @Inject(forwardRef(() => NotificacionGateway))
    private readonly notificacionGateway: NotificacionGateway,
  ) { }

  // Al iniciar el backend, verificar los productos con stock bajo y crear notificaciones
  async onApplicationBootstrap() {
    try {
      // Esperar un momento a que las tablas y roles estén cargados
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const parteRepo = this.notificacionRepository.manager.getRepository(Parte);
      const lowStockParts = await parteRepo.createQueryBuilder('p')
        .where('p.stock <= p.stockMinimo')
        .andWhere('p.unidadMedida != :serv', { serv: 'Servicio' })
        .andWhere('p.deletedAt IS NULL')
        .getMany();

      console.log(`[Alertas Stock] Iniciando chequeo de stock. Encontrados ${lowStockParts.length} repuestos bajo stock mínimo.`);

      for (const parte of lowStockParts) {
        const stockNum = Number(parte.stock);
        let mensaje = '';
        if (stockNum === 0) {
          mensaje = `CRÍTICO: El repuesto "${parte.nombre}" se ha agotado completamente en el almacén.`;
        } else {
          mensaje = `ADVERTENCIA: El repuesto "${parte.nombre}" tiene existencias bajas (${stockNum} unidades restantes).`;
        }

        // Verificar si ya existe una notificación idéntica sin leer para evitar duplicarla
        const existe = await this.notificacionRepository.findOne({
          where: {
            mensaje,
            leido: false,
            isDeleted: false,
          }
        });

        if (!existe) {
          await this.notificarAdmins(
            'Inventario',
            'Alertas y avisos de stock mínimo de almacén',
            mensaje
          );
        }
      }
      console.log('[Alertas Stock] Chequeo de stock completado exitosamente.');
    } catch (error) {
      console.error('Error al inicializar notificaciones de stock bajo:', error);
    }
  }

  // Crear una nueva notificación
  async create(createDto: CreateNotificacionDto): Promise<Notificacion> {
    const notificacion = this.notificacionRepository.create(createDto);
    try {
      const saved = await this.notificacionRepository.save(notificacion);
      
      // Obtener la notificación completa con relaciones cargadas
      const completa = await this.findOne(saved.id);
      
      // Notificar al usuario en tiempo real vía WebSocket
      this.notificacionGateway.enviarNotificacionAUsuario(completa.usuarioId, completa);
      
      return completa;
    } catch (error) {
      throw new InternalServerErrorException(`Error creando notificación: ${error.message}`);
    }
  }

  // Obtener todas las notificaciones no eliminadas
  async findAll(): Promise<Notificacion[]> {
    return await this.notificacionRepository.find({
      where: { isDeleted: false },
      relations: ['usuario', 'ordenServicio', 'tipo'],
      order: { fechaEnvio: 'DESC' },
    });
  }

  // Obtener notificaciones por usuario
  async findByUsuario(usuarioId: number): Promise<Notificacion[]> {
    return await this.notificacionRepository.find({
      where: { usuarioId, isDeleted: false },
      relations: ['ordenServicio', 'tipo'],
      order: { fechaEnvio: 'DESC' },
    });
  }

  // Obtener una sola notificación por ID
  async findOne(id: number): Promise<Notificacion> {
    const notificacion = await this.notificacionRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['usuario', 'ordenServicio', 'tipo'],
    });

    if (!notificacion) {
      throw new NotFoundException(`Notificación con ID ${id} no encontrada.`);
    }

    return notificacion;
  }

  // Marcar como leída
  async marcarComoLeida(id: number): Promise<Notificacion> {
    const notificacion = await this.findOne(id);
    notificacion.leido = true;
    return await this.notificacionRepository.save(notificacion);
  }

  // Actualizar mensaje o tipo (opcional)
  async update(id: number, updateDto: UpdateNotificacionDto): Promise<Notificacion> {
    const notificacion = await this.findOne(id);
    Object.assign(notificacion, updateDto);
    try {
      return await this.notificacionRepository.save(notificacion);
    } catch (error) {
      throw new InternalServerErrorException(`Error actualizando notificación: ${error.message}`);
    }
  }

  // Eliminar (soft delete)
  async remove(id: number): Promise<{ message: string }> {
    const notificacion = await this.findOne(id);
    notificacion.isDeleted = true;
    notificacion.deletedAt = new Date();
    await this.notificacionRepository.save(notificacion);
    return { message: `Notificación con ID ${id} eliminada (soft delete).` };
  }

  async marcarTodasComoLeidas(usuarioId: number): Promise<void> {
    await this.notificacionRepository
      .createQueryBuilder()
      .update()
      .set({ leido: true })
      .where('usuarioId = :usuarioId', { usuarioId })
      .andWhere('isDeleted = false')
      .execute();
  }

  // Obtener o crear tipo de notificación de manera segura
  async getOrCreateTipo(nombre: string, descripcion: string): Promise<number> {
    try {
      const tipoRepo = this.notificacionRepository.manager.getRepository('TipoNotificacion');
      let tipo = await tipoRepo.findOne({ where: { nombre } });
      if (!tipo) {
        tipo = tipoRepo.create({ nombre, descripcion, estado: true });
        tipo = await tipoRepo.save(tipo);
      }
      return tipo.id;
    } catch (error) {
      console.error('Error in getOrCreateTipo:', error);
      return 1; // Fallback al ID 1
    }
  }

  // Helper para notificar asignación de técnico
  async notificarAsignacionTecnico(ordenId: number, tecnicoId: number, workOrderNumber: string) {
    try {
      const tipoId = await this.getOrCreateTipo('Asignación', 'Notificaciones sobre asignación de técnicos a órdenes');
      return await this.create({
        usuarioId: tecnicoId,
        tipoId,
        ordenServicioId: ordenId,
        mensaje: `Se te ha asignado la nueva Orden de Trabajo #${workOrderNumber}.`,
      });
    } catch (error) {
      console.error('Error enviando notificación de asignación:', error);
    }
  }

  // Helper para notificar cambio de estado de ODS
  async notificarCambioEstadoOds(ordenId: number, usuarioId: number, workOrderNumber: string, nuevoEstado: string) {
    try {
      const tipoId = await this.getOrCreateTipo('Orden', 'Notificaciones sobre estados de órdenes de servicio');
      return await this.create({
        usuarioId,
        tipoId,
        ordenServicioId: ordenId,
        mensaje: `La Orden de Trabajo #${workOrderNumber} ha avanzado al estado: ${nuevoEstado}.`,
      });
    } catch (error) {
      console.error('Error enviando notificación de cambio de estado:', error);
    }
  }

  // Helper para notificar aprobación/rechazo de presupuesto
  async notificarPresupuesto(ordenId: number, usuarioId: number, workOrderNumber: string, accionPresupuesto: string) {
    try {
      const tipoId = await this.getOrCreateTipo('Presupuesto', 'Notificaciones sobre presupuestos de reparación');
      return await this.create({
        usuarioId,
        tipoId,
        ordenServicioId: ordenId,
        mensaje: `El presupuesto para la Orden #${workOrderNumber} ha sido ${accionPresupuesto}.`,
      });
    } catch (error) {
      console.error('Error enviando notificación de presupuesto:', error);
    }
  }

  // Helper para notificar a todos los administradores
  async notificarAdmins(tipoNombre: string, descripcionTipo: string, mensaje: string) {
    try {
      const tipoId = await this.getOrCreateTipo(tipoNombre, descripcionTipo);
      const userRepo = this.notificacionRepository.manager.getRepository(User);
      
      const admins = await userRepo.createQueryBuilder('user')
        .leftJoin('user.userRoles', 'userRoles')
        .leftJoin('userRoles.rol', 'rol')
        .where('rol.slug = :role', { role: 'admin' })
        .andWhere('user.deletedAt IS NULL')
        .getMany();

      for (const admin of admins) {
        await this.create({
          usuarioId: admin.id,
          tipoId,
          mensaje,
        });
      }
    } catch (error) {
      console.error('Error al notificar a administradores:', error);
    }
  }

  // Helper para verificar stock y lanzar notificación si es bajo o agotado
  async checkAndNotificarStockBajo(parteId: number) {
    try {
      const parteRepo = this.notificacionRepository.manager.getRepository(Parte);
      const parte = await parteRepo.findOne({ where: { id: parteId } });
      if (!parte || parte.unidadMedida === 'Servicio') return;

      const stockNum = Number(parte.stock);
      const stockMinNum = Number(parte.stockMinimo);

      if (stockNum <= stockMinNum) {
        let mensaje = '';
        if (stockNum === 0) {
          mensaje = `CRÍTICO: El repuesto "${parte.nombre}" se ha agotado completamente en el almacén.`;
        } else {
          mensaje = `ADVERTENCIA: El repuesto "${parte.nombre}" tiene existencias bajas (${stockNum} unidades restantes).`;
        }
        
        await this.notificarAdmins(
          'Inventario',
          'Alertas y avisos de stock mínimo de almacén',
          mensaje
        );
      }
    } catch (error) {
      console.error('Error al verificar stock y notificar:', error);
    }
  }
}
