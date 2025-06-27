import {Injectable,NotFoundException,InternalServerErrorException,BadRequestException,} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadoOrden } from './entities/estado-orden.entity';
import { CreateEstadoOrdenDto } from './dto/create-estado-orden.dto';
import { UpdateEstadoOrdenDto } from './dto/update-estado-orden.dto';

@Injectable()
export class EstadoOrdenService {
  constructor(
    @InjectRepository(EstadoOrden)
    private readonly estadoOrdenRepository: Repository<EstadoOrden>,
  ) {}

  async create(dto: CreateEstadoOrdenDto): Promise<EstadoOrden> {
    const existe = await this.estadoOrdenRepository.findOne({
      where: { nombre: dto.nombre },
    });
    if (existe) {
      throw new BadRequestException(`El estado "${dto.nombre}" ya existe.`);
    }

    const nuevo = this.estadoOrdenRepository.create(dto);
    try {
      return await this.estadoOrdenRepository.save(nuevo);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error al crear estado: ${error.message}`,
      );
    }
  }

  async findAll(): Promise<EstadoOrden[]> {
    return this.estadoOrdenRepository.find({
      where: { deletedAt: null },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<EstadoOrden> {
    const estado = await this.estadoOrdenRepository.findOne({
      where: { id, deletedAt: null },
    });
    if (!estado) {
      throw new NotFoundException(`Estado con ID ${id} no encontrado.`);
    }
    return estado;
  }

  async update(
    id: number,
    dto: UpdateEstadoOrdenDto,
  ): Promise<EstadoOrden> {
    const estado = await this.findOne(id);

    // Validar que no se repita el nombre si se cambia
    if (dto.nombre && dto.nombre !== estado.nombre) {
      const duplicado = await this.estadoOrdenRepository.findOne({
        where: { nombre: dto.nombre },
      });
      if (duplicado) {
        throw new BadRequestException(`Ya existe un estado con el nombre "${dto.nombre}".`);
      }
    }

    Object.assign(estado, dto);
    try {
      return await this.estadoOrdenRepository.save(estado);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error al actualizar estado: ${error.message}`,
      );
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    const estado = await this.findOne(id);
    estado.deletedAt = new Date();
    await this.estadoOrdenRepository.save(estado);
    return { message: `Estado con ID ${id} eliminado (soft delete).` };
  }
}
