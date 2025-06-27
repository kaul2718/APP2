import {  BadRequestException,Injectable,InternalServerErrorException,NotFoundException,} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoNotificacion } from './entities/tipo-notificacion.entity';
import { CreateTipoNotificacionDto } from './dto/create-tipo-notificacion.dto';
import { UpdateTipoNotificacionDto } from './dto/update-tipo-notificacion.dto';

@Injectable()
export class TipoNotificacionService {
  constructor(
    @InjectRepository(TipoNotificacion)
    private readonly tipoRepo: Repository<TipoNotificacion>,
  ) {}

  async create(createDto: CreateTipoNotificacionDto): Promise<TipoNotificacion> {
    const nuevoTipo = this.tipoRepo.create(createDto);
    try {
      return await this.tipoRepo.save(nuevoTipo);
    } catch (error) {
      throw new InternalServerErrorException(`Error al crear tipo de notificación: ${error.message}`);
    }
  }

  async findAll(): Promise<TipoNotificacion[]> {
    return this.tipoRepo.find({
      where: { isDeleted: false },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<TipoNotificacion> {
    const tipo = await this.tipoRepo.findOne({
      where: { id, isDeleted: false },
    });

    if (!tipo) {
      throw new NotFoundException(`Tipo de notificación con ID ${id} no encontrado.`);
    }

    return tipo;
  }

  async update(id: number, updateDto: UpdateTipoNotificacionDto): Promise<TipoNotificacion> {
    const tipo = await this.findOne(id);

    Object.assign(tipo, updateDto); // updatedAt se actualiza automáticamente

    try {
      return await this.tipoRepo.save(tipo);
    } catch (error) {
      throw new InternalServerErrorException(`Error al actualizar tipo de notificación: ${error.message}`);
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    const tipo = await this.findOne(id);

    tipo.isDeleted = true;
    tipo.deletedAt = new Date();

    await this.tipoRepo.save(tipo);

    return { message: `Tipo de notificación con ID ${id} eliminado (soft delete).` };
  }
}
