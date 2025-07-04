import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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
      where: { numeroSerie },
      withDeleted: true,
    });

    if (existingEquipo) {
      throw new BadRequestException('El número de serie ya está registrado.');
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
    return this.equipoRepository.find({
      where: includeDeleted ? {} : { estado: true },
      withDeleted: includeDeleted,
      relations: ['ordenes', 'tipoEquipo', 'marca', 'modelo'],
    });
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
    page: number,
    limit: number,
    search?: string,
    includeDeleted = false,
  ): Promise<{ data: Equipo[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = this.equipoRepository.createQueryBuilder('equipo')
      .leftJoinAndSelect('equipo.tipoEquipo', 'tipoEquipo')
      .leftJoinAndSelect('equipo.marca', 'marca')
      .leftJoinAndSelect('equipo.modelo', 'modelo');

    if (search) {
      query.where('LOWER(equipo.numeroSerie) LIKE LOWER(:search)', { search: `%${search}%` });
    }

    if (!includeDeleted) {
      query.andWhere('equipo.deletedAt IS NULL');
    }

    query.skip(skip).take(limit).orderBy('equipo.numeroSerie', 'ASC');

    const [data, total] = await query.getManyAndCount();

    return { data, total };
  }

  async actualizarEstado(id: number, estado: boolean): Promise<Equipo> {
    const equipo = await this.equipoRepository.findOneBy({ id });
    if (!equipo) throw new NotFoundException('Equipo no encontrado');

    equipo.estado = estado;
    await this.equipoRepository.save(equipo);

    return equipo;
  }
}