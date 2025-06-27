import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacion } from './entities/notificacion.entity';
import { CreateNotificacionDto } from './dto/create-notificacion.dto';
import { UpdateNotificacionDto } from './dto/update-notificacion.dto';

@Injectable()
export class NotificacionService {
  constructor(
    @InjectRepository(Notificacion)
    private readonly notificacionRepository: Repository<Notificacion>,
  ) { }

  // Crear una nueva notificación
  async create(createDto: CreateNotificacionDto): Promise<Notificacion> {
    const notificacion = this.notificacionRepository.create(createDto);
    try {
      return await this.notificacionRepository.save(notificacion);
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

}
