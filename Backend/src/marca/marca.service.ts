import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Marca } from './entities/marca.entity';
import { CreateMarcaDto } from './dto/create-marca.dto';
import { UpdateMarcaDto } from './dto/update-marca.dto';

@Injectable()
export class MarcaService {
  constructor(
    @InjectRepository(Marca)
    private readonly marcaRepository: Repository<Marca>,
  ) { }

  async create(createDto: CreateMarcaDto): Promise<Marca> {
    const existe = await this.marcaRepository.findOne({
      where: { nombre: createDto.nombre },
      withDeleted: true,
    });

    if (existe) {
      throw new BadRequestException('Ya existe una marca con ese nombre.');
    }

    const nuevo = this.marcaRepository.create(createDto);
    return this.marcaRepository.save(nuevo);
  }

  findAll(includeDeleted = false): Promise<Marca[]> {
    return this.marcaRepository.find({
      where: includeDeleted ? {} : { estado: true },
      withDeleted: includeDeleted,
      relations: ['modelos'],
    });
  }

  async findOne(id: number, includeDeleted = false): Promise<Marca> {
    const marca = await this.marcaRepository.findOne({
      where: { id },
      withDeleted: includeDeleted,
      relations: ['modelos'],
    });

    if (!marca) {
      throw new NotFoundException('Marca no encontrada.');
    }

    return marca;
  }

  async update(id: number, updateDto: UpdateMarcaDto): Promise<Marca> {
    const marca = await this.findOne(id, true);

    if (updateDto.nombre) {
      const duplicado = await this.marcaRepository.findOne({
        where: { nombre: updateDto.nombre },
        withDeleted: true,
      });

      if (duplicado && duplicado.id !== id) {
        throw new BadRequestException('Ya existe una marca con ese nombre.');
      }
    }

    Object.assign(marca, updateDto);
    return this.marcaRepository.save(marca);
  }

  async remove(id: number): Promise<{ message: string }> {
    const marca = await this.findOne(id);
    marca.estado = false;
    await this.marcaRepository.softRemove(marca);
    return { message: `Marca con ID ${id} deshabilitada (soft delete).` };
  }

  async restore(id: number): Promise<{ message: string }> {
    const marca = await this.findOne(id, true);

    if (!marca.deletedAt) {
      throw new BadRequestException('La marca no está eliminada.');
    }

    await this.marcaRepository.restore(id);
    marca.estado = true;
    await this.marcaRepository.save(marca);
    return { message: `Marca con ID ${id} restaurada.` };
  }

  async findAllPaginated(
    page: number,
    limit: number,
    search?: string,
    includeDeleted = false,
  ): Promise<{ data: Marca[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = this.marcaRepository.createQueryBuilder('marca');

    if (search) {
      query.where('LOWER(marca.nombre) LIKE LOWER(:search)', { search: `%${search}%` });
    }

    if (!includeDeleted) {
      query.andWhere('marca.deletedAt IS NULL');
    }

    query.skip(skip)
      .take(limit)
      .orderBy('marca.nombre', 'ASC')
      .leftJoinAndSelect('marca.modelos', 'modelos');

    const [data, total] = await query.getManyAndCount();

    return { data, total };
  }

  async actualizarEstado(id: number, estado: boolean): Promise<Marca> {
    const marca = await this.marcaRepository.findOneBy({ id });
    if (!marca) throw new NotFoundException('Marca no encontrada');

    marca.estado = estado;
    await this.marcaRepository.save(marca);

    return marca;
  }
}