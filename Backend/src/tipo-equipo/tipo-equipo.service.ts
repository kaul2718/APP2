import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { TipoEquipo } from './entities/tipo-equipo.entity';
import { CreateTipoEquipoDto } from './dto/create-tipo-equipo.dto';
import { UpdateTipoEquipoDto } from './dto/update-tipo-equipo.dto';

@Injectable()
export class TipoEquipoService {
  constructor(
    @InjectRepository(TipoEquipo)
    private readonly tipoEquipoRepository: Repository<TipoEquipo>,
  ) { }

  async create(createDto: CreateTipoEquipoDto): Promise<TipoEquipo> {
    const existe = await this.tipoEquipoRepository.findOne({
      where: { nombre: createDto.nombre },
      withDeleted: true,
    });

    if (existe) {
      throw new BadRequestException('Ya existe un tipo de equipo con ese nombre.');
    }

    const nuevo = this.tipoEquipoRepository.create(createDto);
    return this.tipoEquipoRepository.save(nuevo);
  }

  findAll(includeDeleted = false): Promise<TipoEquipo[]> {
    return this.tipoEquipoRepository.find({
      where: includeDeleted ? {} : { estado: true },
      withDeleted: includeDeleted,
      relations: ['equipos'],
    });
  }

  async findOne(id: number, includeDeleted = false): Promise<TipoEquipo> {
    const tipo = await this.tipoEquipoRepository.findOne({
      where: { id },
      withDeleted: includeDeleted,
      relations: ['equipos'],
    });

    if (!tipo) {
      throw new NotFoundException('Tipo de equipo no encontrado.');
    }

    return tipo;
  }

  async update(id: number, updateDto: UpdateTipoEquipoDto): Promise<TipoEquipo> {
    const tipo = await this.findOne(id, true);

    if (updateDto.nombre) {
      const duplicado = await this.tipoEquipoRepository.findOne({
        where: { nombre: updateDto.nombre },
        withDeleted: true,
      });

      if (duplicado && duplicado.id !== id) {
        throw new BadRequestException('Ya existe un tipo de equipo con ese nombre.');
      }
    }

    Object.assign(tipo, updateDto);
    return this.tipoEquipoRepository.save(tipo);
  }

  async remove(id: number): Promise<{ message: string }> {
    const tipo = await this.findOne(id);
    tipo.estado = false;
    await this.tipoEquipoRepository.softRemove(tipo);
    return { message: `Tipo de equipo con ID ${id} deshabilitado (soft delete).` };
  }

  async restore(id: number): Promise<{ message: string }> {
    const tipo = await this.findOne(id, true);

    if (!tipo.deletedAt) {
      throw new BadRequestException('El tipo de equipo no está eliminado.');
    }

    await this.tipoEquipoRepository.restore(id);
    tipo.estado = true;
    await this.tipoEquipoRepository.save(tipo);
    return { message: `Tipo de equipo con ID ${id} restaurado.` };
  }

  async findAllPaginated(
    page: number,
    limit: number,
    search?: string,
    includeDeleted = false,
  ): Promise<{ data: TipoEquipo[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = this.tipoEquipoRepository.createQueryBuilder('tipoEquipo');

    if (search) {
      query.where('LOWER(tipoEquipo.nombre) LIKE LOWER(:search)', { search: `%${search}%` });
    }

    if (!includeDeleted) {
      query.andWhere('tipoEquipo.deletedAt IS NULL');
    }

    query.skip(skip).take(limit).orderBy('tipoEquipo.nombre', 'ASC').leftJoinAndSelect('tipoEquipo.equipos', 'equipos');

    const [data, total] = await query.getManyAndCount();

    return { data, total };
  }

  async actualizarEstado(id: number, estado: boolean) {
    const tipoEquipo = await this.tipoEquipoRepository.findOneBy({ id });
    if (!tipoEquipo) throw new NotFoundException('Tipo de equipo no encontrado');

    tipoEquipo.estado = estado;
    await this.tipoEquipoRepository.save(tipoEquipo);

    return tipoEquipo;
  }
}
