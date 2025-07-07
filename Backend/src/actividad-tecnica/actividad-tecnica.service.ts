import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActividadTecnica } from './entities/actividad-tecnica.entity';
import { CreateActividadTecnicaDto } from './dto/create-actividad-tecnica.dto';
import { UpdateActividadTecnicaDto } from './dto/update-actividad-tecnica.dto';
import { Order } from 'src/orders/entities/order.entity';
import { TipoActividadTecnica } from 'src/tipo-actividad-tecnica/entities/tipo-actividad-tecnica.entity';

@Injectable()
export class ActividadTecnicaService {
  constructor(
    @InjectRepository(ActividadTecnica)
    private readonly actividadRepository: Repository<ActividadTecnica>,

    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(TipoActividadTecnica)
    private readonly tipoRepository: Repository<TipoActividadTecnica>,
  ) { }

  async create(createDto: CreateActividadTecnicaDto): Promise<ActividadTecnica> {
    const actividad = this.actividadRepository.create({
      ordenId: createDto.ordenId,
      tipoActividadId: createDto.tipoActividadId,
      diagnostico: createDto.diagnostico,
      trabajoRealizado: createDto.trabajoRealizado,
      estado: createDto.estado,

      fecha: new Date(),
    });
    const orden = await this.orderRepository.findOne({
      where: { id: createDto.ordenId },
    });
    if (!orden) {
      throw new BadRequestException(`La orden con ID ${createDto.ordenId} no existe.`);
    }

    const tipo = await this.tipoRepository.findOne({
      where: { id: createDto.tipoActividadId, estado: true },
    });
    if (!tipo) {
      throw new BadRequestException(`El tipo de actividad con ID ${createDto.tipoActividadId} no es válido.`);
    }
    try {
      return await this.actividadRepository.save(actividad);
    } catch (error) {
      throw new InternalServerErrorException(`Error creando actividad técnica: ${error.message}`);
    }
  }

  async findAll(): Promise<ActividadTecnica[]> {
    return this.actividadRepository.find({
      relations: ['orden', 'tipoActividad'],
      withDeleted: false, // <- asegura que no traiga registros soft-deleted
    });
  }

  async findOne(id: number): Promise<ActividadTecnica> {
    const actividad = await this.actividadRepository.findOne({
      where: { id },
      relations: ['orden', 'tipoActividad'],
      withDeleted: false,
    });

    if (!actividad) {
      throw new NotFoundException(`Actividad técnica con ID ${id} no encontrada.`);
    }

    return actividad;
  }

  async findByOrdenId(ordenId: number): Promise<ActividadTecnica[]> {
    return this.actividadRepository.find({
      where: { ordenId },
      relations: ['orden', 'tipoActividad'],
    });
  }

  async update(id: number, updateDto: UpdateActividadTecnicaDto): Promise<ActividadTecnica> {
    const actividad = await this.findOne(id);

    actividad.diagnostico = updateDto.diagnostico ?? actividad.diagnostico;
    actividad.trabajoRealizado = updateDto.trabajoRealizado ?? actividad.trabajoRealizado;

    // Agregar actualización del estado si viene en el DTO
    if (updateDto.estado !== undefined) {
      actividad.estado = updateDto.estado;
    }

    if (updateDto.tipoActividadId) {
      const tipo = await this.tipoRepository.findOne({
        where: { id: updateDto.tipoActividadId, estado: true },
      });
      if (!tipo) {
        throw new BadRequestException(`El tipo de actividad con ID ${updateDto.tipoActividadId} no es válido.`);
      }
      actividad.tipoActividadId = tipo.id;
      actividad.tipoActividad = tipo;
    }

    if (updateDto.ordenId) {
      const orden = await this.orderRepository.findOne({
        where: { id: updateDto.ordenId },
      });
      if (!orden) {
        throw new BadRequestException(`La orden con ID ${updateDto.ordenId} no existe.`);
      }
      actividad.ordenId = orden.id;
      actividad.orden = orden;
    }

    try {
      return await this.actividadRepository.save(actividad);
    } catch (error) {
      throw new InternalServerErrorException(`Error actualizando actividad técnica: ${error.message}`);
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    const actividad = await this.findOne(id);

    try {
      await this.actividadRepository.softDelete(id);
      return { message: `Actividad técnica con ID ${id} eliminada correctamente (soft delete).` };
    } catch (error) {
      throw new InternalServerErrorException(`Error eliminando actividad técnica: ${error.message}`);
    }
  }

  async restore(id: number): Promise<{ message: string }> {
    const actividad = await this.actividadRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!actividad || !actividad.deletedAt) {
      throw new NotFoundException(`Actividad técnica con ID ${id} no se encuentra eliminada.`);
    }

    await this.actividadRepository.restore(id);
    return { message: `Actividad técnica con ID ${id} restaurada exitosamente.` };
  }

  async findAllPaginated(
    page: number,
    limit: number,
    search?: string,
    includeInactive = false,
  ): Promise<{ data: ActividadTecnica[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = this.actividadRepository.createQueryBuilder('actividad')
      .leftJoinAndSelect('actividad.orden', 'orden')
      .leftJoinAndSelect('actividad.tipoActividad', 'tipoActividad');

    if (search) {
      query.where('LOWER(actividad.diagnostico) LIKE LOWER(:search) OR LOWER(actividad.trabajoRealizado) LIKE LOWER(:search)', {
        search: `%${search}%`
      });
    }

    if (!includeInactive) {
      query.andWhere('actividad.estado = :estado', { estado: true })
    }

    query.skip(skip)
      .take(limit)
      .orderBy('actividad.fecha', 'DESC');

    const [data, total] = await query.getManyAndCount();

    return { data, total };
  }

  async toggleStatus(id: number): Promise<ActividadTecnica> {
    const actividad = await this.actividadRepository.findOne({
      where: { id },
      withDeleted: false,
    });

    if (!actividad) {
      throw new NotFoundException(`Actividad técnica con ID ${id} no encontrada.`);
    }

    actividad.estado = !actividad.estado;
    await this.actividadRepository.save(actividad);

    return actividad;
  }
}
