import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
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
  ) { }

  async create(createDto: CreateEvidenciaTecnicaDto): Promise<EvidenciaTecnica> {
    const { ordenId, subidoPorId, archivoUrl, descripcion } = createDto;

    if (!archivoUrl) {
      throw new InternalServerErrorException('Debe proporcionar una URL o archivo');
    }

    const orden = await this.orderRepository.findOne({ 
      where: { id: ordenId },
      relations: ['estadoOrden']
    });
    if (!orden) {
      throw new NotFoundException(`Orden con ID ${ordenId} no encontrada`);
    }

    const usuario = await this.userRepository.findOne({ where: { id: subidoPorId } });
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${subidoPorId} no encontrado`);
    }

    const evidencia = this.evidenciaRepository.create({
      orden,
      subidoPor: usuario,
      estadoOrden: orden.estadoOrden,
      archivoUrl,
      tipoArchivo: this.determinarTipoArchivo(archivoUrl),
      descripcion,
    });

    try {
      return await this.evidenciaRepository.save(evidencia);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error creando evidencia técnica: ${error.message}`,
      );
    }
  }

  private determinarTipoArchivo(archivoUrl: string): 'imagen' | 'video' {
    if (archivoUrl.startsWith('data:image')) return 'imagen';
    if (archivoUrl.startsWith('data:video')) return 'video';
    if (archivoUrl.match(/\.(jpg|jpeg|png|gif)$/i)) return 'imagen';
    if (archivoUrl.match(/\.(mp4|mov|avi)$/i)) return 'video';
    return 'imagen';
  }

  async findAll(
    ordenId?: number,
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: EvidenciaTecnica[], total: number }> {
    const skip = (page - 1) * limit;

    const query = this.evidenciaRepository.createQueryBuilder('evidencia')
      .leftJoinAndSelect('evidencia.orden', 'orden')
      .leftJoinAndSelect('evidencia.subidoPor', 'usuario')
      .leftJoinAndSelect('evidencia.estadoOrden', 'estadoOrden')
      .where('evidencia.deletedAt IS NULL')
      .orderBy('evidencia.fechaSubida', 'DESC')
      .skip(skip)
      .take(limit);

    if (ordenId) {
      query.andWhere('evidencia.ordenId = :ordenId', { ordenId });
    }

    const [items, total] = await query.getManyAndCount();
    return { items, total };
  }

  async findOne(id: number): Promise<EvidenciaTecnica> {
    const evidencia = await this.evidenciaRepository.findOne({
      where: { id, deletedAt: null },
      relations: ['orden', 'subidoPor'],
    });
    if (!evidencia) {
      throw new NotFoundException(`Evidencia técnica con ID ${id} no encontrada.`);
    }
    return evidencia;
  }

  async update(
    id: number,
    updateDto: UpdateEvidenciaTecnicaDto,
  ): Promise<EvidenciaTecnica> {
    const evidencia = await this.findOne(id);

    if (updateDto.ordenId && updateDto.ordenId !== evidencia.orden.id) {
      const nuevaOrden = await this.orderRepository.findOne({
        where: { id: updateDto.ordenId },
      });
      if (!nuevaOrden) {
        throw new NotFoundException(`Orden con ID ${updateDto.ordenId} no encontrada`);
      }
      evidencia.orden = nuevaOrden;
    }

    if (updateDto.subidoPorId && updateDto.subidoPorId !== evidencia.subidoPor.id) {
      const nuevoUsuario = await this.userRepository.findOne({
        where: { id: updateDto.subidoPorId },
      });
      if (!nuevoUsuario) {
        throw new NotFoundException(`Usuario con ID ${updateDto.subidoPorId} no encontrado`);
      }
      evidencia.subidoPor = nuevoUsuario;
    }

    if (updateDto.archivoUrl) {
      evidencia.archivoUrl = updateDto.archivoUrl;
      evidencia.tipoArchivo = this.determinarTipoArchivo(updateDto.archivoUrl);
    }

    evidencia.descripcion = updateDto.descripcion ?? evidencia.descripcion;

    try {
      return await this.evidenciaRepository.save(evidencia);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error actualizando evidencia técnica: ${error.message}`,
      );
    }
  }

  async remove(id: number): Promise<void> {
    const evidencia = await this.findOne(id);
    evidencia.deletedAt = new Date();
    await this.evidenciaRepository.save(evidencia);
  }
}