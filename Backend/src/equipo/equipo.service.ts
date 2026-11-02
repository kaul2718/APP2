import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { UpdateEquipoDto } from './dto/update-equipo.dto';
import { Equipo } from './entities/equipo.entity';
import { Order } from '../orders/entities/order.entity';
import { TipoEquipo } from '../tipo-equipo/entities/tipo-equipo.entity';
import { Marca } from '../marca/entities/marca.entity';
import { Modelo } from '../modelo/entities/modelo.entity';

@Injectable()
export class EquipoService {
  constructor(
    @InjectRepository(Equipo)
    private readonly equipoRepository: Repository<Equipo>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(TipoEquipo)
    private readonly tipoEquipoRepository: Repository<TipoEquipo>,
    @InjectRepository(Marca)
    private readonly marcaRepository: Repository<Marca>,
    @InjectRepository(Modelo)
    private readonly modeloRepository: Repository<Modelo>,
  ) {}

  async create(createEquipoDto: CreateEquipoDto): Promise<Equipo> {
    const { numeroSerie, tipoEquipoId, marcaId, modeloId, ...equipoData } = createEquipoDto;

    // Verificar número de serie único (incluyendo eliminados)
    const existingEquipo = await this.equipoRepository.findOne({
      where: { numeroSerie: numeroSerie.trim() },
      withDeleted: true,
      relations: ['tipoEquipo', 'marca', 'modelo'],
    });

    if (existingEquipo) {
      const ordenActiva = await this.orderRepository.createQueryBuilder('order')
        .leftJoinAndSelect('order.estadoOrden', 'estadoOrden')
        .where('order.equipoId = :equipoId', { equipoId: existingEquipo.id })
        .andWhere('order.estado = true')
        .andWhere('order.deletedAt IS NULL')
        .andWhere('LOWER(estadoOrden.nombre) NOT IN (:...estadosFinales)', {
          estadosFinales: ['archivados', 'anulado', 'cancelado'],
        })
        .getOne();

      if (ordenActiva) {
        throw new ConflictException(
          `El equipo con número de serie '${numeroSerie}' ya está registrado y se encuentra actualmente en taller bajo la orden #${ordenActiva.workOrderNumber} (Estado: ${ordenActiva.estadoOrden?.nombre || 'En taller'}).`
        );
      }

      throw new ConflictException(
        `El equipo con número de serie '${numeroSerie}' ya se encuentra registrado en el sistema (${existingEquipo.marca?.nombre || ''} ${existingEquipo.modelo?.nombre || ''}). Puede seleccionarlo directamente en la lista de equipos.`
      );
    }

    // Verificar relaciones
    const [tipoEquipo, marca, modelo] = await Promise.all([
      this.tipoEquipoRepository.findOneBy({ id: tipoEquipoId }),
      this.marcaRepository.findOneBy({ id: marcaId }),
      this.modeloRepository.findOneBy({ id: modeloId }),
    ]);

    if (!tipoEquipo) throw new NotFoundException('Tipo de equipo no encontrado.');
    if (!marca) throw new NotFoundException('Marca no encontrada.');
    if (!modelo) throw new NotFoundException('Modelo no encontrado.');

    const equipo = this.equipoRepository.create({
      numeroSerie,
      tipoEquipo,
      marca,
      modelo,
      estado: true, // Por defecto activo
      ...equipoData,
    });

    return this.equipoRepository.save(equipo);
  }

  async findAll(includeDeleted = false): Promise<Equipo[]> {
    const equipos = await this.equipoRepository.find({
      where: includeDeleted ? {} : { estado: true },
      withDeleted: includeDeleted,
      relations: ['ordenes', 'tipoEquipo', 'marca', 'modelo'],
    });

    await this.enriquecerConOrdenActiva(equipos);

    return equipos;
  }

  async findOne(id: number, includeDeleted = false): Promise<Equipo> {
    const equipo = await this.equipoRepository.findOne({
      where: { id },
      withDeleted: includeDeleted,
      relations: ['ordenes', 'tipoEquipo', 'marca', 'modelo'],
    });

    if (!equipo) {
      throw new NotFoundException('Equipo no encontrado.');
    }

    await this.enriquecerConOrdenActiva([equipo]);

    return equipo;
  }

  async update(id: number, updateEquipoDto: UpdateEquipoDto): Promise<Equipo> {
    const equipo = await this.findOne(id, true);

    // Validar número de serie único
    if (updateEquipoDto.numeroSerie) {
      const existingEquipo = await this.equipoRepository.findOne({
        where: { numeroSerie: updateEquipoDto.numeroSerie },
        withDeleted: true,
      });

      if (existingEquipo && existingEquipo.id !== id) {
        throw new BadRequestException('El número de serie ya está en uso.');
      }
    }

    // Actualizar relaciones si existen en el DTO
    const [tipoEquipo, marca, modelo] = await Promise.all([
      updateEquipoDto.tipoEquipoId 
        ? this.tipoEquipoRepository.findOneBy({ id: updateEquipoDto.tipoEquipoId })
        : Promise.resolve(null),
      updateEquipoDto.marcaId 
        ? this.marcaRepository.findOneBy({ id: updateEquipoDto.marcaId })
        : Promise.resolve(null),
      updateEquipoDto.modeloId 
        ? this.modeloRepository.findOneBy({ id: updateEquipoDto.modeloId })
        : Promise.resolve(null),
    ]);

    if (updateEquipoDto.tipoEquipoId && !tipoEquipo) {
      throw new NotFoundException('Tipo de equipo no encontrado.');
    }
    if (updateEquipoDto.marcaId && !marca) {
      throw new NotFoundException('Marca no encontrada.');
    }
    if (updateEquipoDto.modeloId && !modelo) {
      throw new NotFoundException('Modelo no encontrado.');
    }

    // Actualizar propiedades
    Object.assign(equipo, updateEquipoDto);
    if (tipoEquipo) equipo.tipoEquipo = tipoEquipo;
    if (marca) equipo.marca = marca;
    if (modelo) equipo.modelo = modelo;

    return this.equipoRepository.save(equipo);
  }

  async remove(id: number): Promise<Equipo> {
    const equipo = await this.findOne(id);
    
    // Verificar si está asignado a alguna orden
    const ordenAsignada = await this.orderRepository.findOne({
      where: { equipoId: id },
    });
    if (ordenAsignada) {
      throw new BadRequestException('No se puede eliminar el equipo porque está asignado a una orden.');
    }

    equipo.estado = false;
    await this.equipoRepository.softRemove(equipo);
    return this.findOne(id, true); // Devuelve el equipo eliminado
  }

  async restore(id: number): Promise<Equipo> {
    const equipo = await this.findOne(id, true);

    if (!equipo.deletedAt) {
      throw new BadRequestException('El equipo no está eliminado.');
    }

    await this.equipoRepository.restore(id);
    equipo.estado = true;
    await this.equipoRepository.save(equipo);
    return this.findOne(id); // Devuelve el equipo restaurado
  }

  async findAllPaginated(
    page: any,
    limit: any,
    search?: string,
    includeInactive = false,
  ): Promise<{ data: Equipo[]; total: number }> {
    const whereCondition: any = {};
    
    if (!includeInactive) {
      whereCondition.estado = true;
    }

    if (search) {
      whereCondition.numeroSerie = Like(`%${search}%`);
    }

    const limitNum = Number(limit) || 10;
    const pageNum = Number(page) || 1;
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await this.equipoRepository.findAndCount({
      where: whereCondition,
      relations: ['tipoEquipo', 'marca', 'modelo'],
      order: { numeroSerie: 'ASC' },
      skip: skip,
      take: limitNum,
    });

    await this.enriquecerConOrdenActiva(data);

    return { data, total };
  }

  /**
   * Enriquece una lista de equipos con los datos de su orden activa si se encuentra en taller.
   */
  private async enriquecerConOrdenActiva(equipos: Equipo[]): Promise<Equipo[]> {
    if (!equipos || equipos.length === 0) return equipos;

    const equipoIds = equipos.map(e => e.id);
    const activeOrders = await this.orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.estadoOrden', 'estadoOrden')
      .where('order.equipoId IN (:...equipoIds)', { equipoIds })
      .andWhere('order.estado = :estado', { estado: true })
      .andWhere('order.deletedAt IS NULL')
      .andWhere('LOWER(estadoOrden.nombre) NOT IN (:...estadosFinales)', {
        estadosFinales: ['archivados', 'anulado', 'cancelado'],
      })
      .select(['order.id', 'order.workOrderNumber', 'order.equipoId', 'estadoOrden.id', 'estadoOrden.nombre'])
      .getMany();

    const activeOrderMap = new Map<number, any>();
    for (const ord of activeOrders) {
      activeOrderMap.set(ord.equipoId, {
        id: ord.id,
        workOrderNumber: ord.workOrderNumber,
        estadoId: ord.estadoOrden?.id,
        estadoNombre: ord.estadoOrden?.nombre || 'En taller',
      });
    }

    for (const eq of equipos) {
      (eq as any).ordenActiva = activeOrderMap.get(eq.id) || null;
    }

    return equipos;
  }

  async actualizarEstado(id: number, estado: boolean): Promise<Equipo> {
    const equipo = await this.equipoRepository.findOneBy({ id });
    if (!equipo) throw new NotFoundException('Equipo no encontrado');

    equipo.estado = estado;
    await this.equipoRepository.save(equipo);

    return equipo;
  }
}