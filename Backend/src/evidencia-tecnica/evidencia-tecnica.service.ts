import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvidenciaTecnica } from './entities/evidencia-tecnica.entity';
import { CreateEvidenciaTecnicaDto } from './dto/create-evidencia-tecnica.dto';
import { UpdateEvidenciaTecnicaDto } from './dto/update-evidencia-tecnica.dto';
import { Order } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class EvidenciaTecnicaService {
  constructor(
    @InjectRepository(EvidenciaTecnica)
    private readonly evidenciaRepository: Repository<EvidenciaTecnica>,

    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createDto: CreateEvidenciaTecnicaDto): Promise<EvidenciaTecnica> {
    const { ordenId, subidoPorId, urlImagen, descripcion } = createDto;

    const orden = await this.orderRepository.findOne({ where: { id: ordenId } });
    if (!orden) {
      throw new NotFoundException(`Orden con ID ${ordenId} no encontrada`);
    }

    const usuario = await this.userRepository.findOne({ where: { id: subidoPorId } });
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${subidoPorId} no encontrado`);
    }

    const evidencia = new EvidenciaTecnica();
    evidencia.orden = orden;
    evidencia.subidoPor = usuario;
    evidencia.urlImagen = urlImagen;
    evidencia.descripcion = descripcion;

    try {
      return await this.evidenciaRepository.save(evidencia);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error creando evidencia técnica: ${error.message}`,
      );
    }
  }

  async findAll(): Promise<EvidenciaTecnica[]> {
    return this.evidenciaRepository.find({
      where: { isDeleted: false },
      relations: ['orden', 'subidoPor'],
    });
  }

  async findOne(id: number): Promise<EvidenciaTecnica> {
    const evidencia = await this.evidenciaRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['orden', 'subidoPor'],
    });
    if (!evidencia) {
      throw new NotFoundException(
        `Evidencia técnica con ID ${id} no encontrada.`,
      );
    }
    return evidencia;
  }

  async update(
    id: number,
    updateDto: UpdateEvidenciaTecnicaDto,
  ): Promise<EvidenciaTecnica> {
    const evidencia = await this.findOne(id);

    // Cambiar orden si viene nueva
    if (updateDto.ordenId && updateDto.ordenId !== evidencia.orden.id) {
      const nuevaOrden = await this.orderRepository.findOne({
        where: { id: updateDto.ordenId },
      });
      if (!nuevaOrden) {
        throw new NotFoundException(`Orden con ID ${updateDto.ordenId} no encontrada`);
      }
      evidencia.orden = nuevaOrden;
    }

    // Cambiar usuario si viene nuevo
    if (updateDto.subidoPorId && updateDto.subidoPorId !== evidencia.subidoPor.id) {
      const nuevoUsuario = await this.userRepository.findOne({
        where: { id: updateDto.subidoPorId },
      });
      if (!nuevoUsuario) {
        throw new NotFoundException(`Usuario con ID ${updateDto.subidoPorId} no encontrado`);
      }
      evidencia.subidoPor = nuevoUsuario;
    }

    evidencia.urlImagen = updateDto.urlImagen ?? evidencia.urlImagen;
    evidencia.descripcion = updateDto.descripcion ?? evidencia.descripcion;

    try {
      return await this.evidenciaRepository.save(evidencia);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error actualizando evidencia técnica: ${error.message}`,
      );
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    const evidencia = await this.findOne(id);
    evidencia.isDeleted = true;
    evidencia.deletedAt = new Date();
    await this.evidenciaRepository.save(evidencia);
    return {
      message: `Evidencia técnica con ID ${id} eliminada (soft delete).`,
    };
  }
}
