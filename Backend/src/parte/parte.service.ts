import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Parte } from './entities/parte.entity';
import { Categoria } from '../categoria/entities/categoria.entity';
import { Marca } from '../marca/entities/marca.entity';
import { CreateParteDto } from './dto/create-parte.dto';
import { UpdateParteDto } from './dto/update-parte.dto';

@Injectable()
export class ParteService {
  constructor(
    @InjectRepository(Parte)
    private readonly parteRepository: Repository<Parte>,
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
    @InjectRepository(Marca)
    private readonly marcaRepository: Repository<Marca>,
  ) { }

  private buildCodigoInterno(parte: Pick<Parte, 'id' | 'nombre' | 'modelo'>): string {
    const base = (parte.modelo || parte.nombre || 'ITEM')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 18);

    return `${base || 'ITEM'}-${parte.id}`;
  }


  async create(createDto: CreateParteDto): Promise<Parte> {
    // Verificar si ya existe una parte con el mismo modelo o nombre
    const existe = await this.parteRepository.findOne({
      where: [
        { modelo: createDto.modelo },
        { nombre: createDto.nombre }
      ],
      withDeleted: true,
    });

    if (existe) {
      if (existe.modelo === createDto.modelo) {
        throw new BadRequestException('Ya existe una parte con ese modelo');
      }
      if (existe.nombre === createDto.nombre) {
        throw new BadRequestException('Ya existe una parte con ese nombre');
      }
    }

    // Verificar y obtener la categoría
    const categoria = await this.categoriaRepository.findOne({ 
      where: { id: createDto.categoriaId } 
    });
    if (!categoria) {
      throw new NotFoundException('Categoría no encontrada');
    }

    // Verificar y obtener la marca
    const marca = await this.marcaRepository.findOne({ 
      where: { id: createDto.marcaId } 
    });
    if (!marca) {
      throw new NotFoundException('Marca no encontrada');
    }

    const nuevo = this.parteRepository.create({
      nombre: createDto.nombre,
      modelo: createDto.modelo,
      descripcion: createDto.descripcion,
      codigoInterno: createDto.codigoInterno?.trim() || null,
      precioReferencia: Number(createDto.precioReferencia ?? 0),
      categoria,
      marca,
      estado: createDto.estado ?? true,
    });

    const parteGuardada = await this.parteRepository.save(nuevo);

    if (!parteGuardada.codigoInterno?.trim()) {
      parteGuardada.codigoInterno = this.buildCodigoInterno(parteGuardada);
      await this.parteRepository.save(parteGuardada);
    }

    return this.findOne(parteGuardada.id, true);
  }

  findAll(includeInactive = false): Promise<Parte[]> {
    return this.parteRepository.find({
      where: includeInactive ? {} : { estado: true },
      withDeleted: includeInactive,
      relations: ['categoria', 'marca', 'inventarios'],
    });
  }

  async findOne(id: number, includeInactive = false): Promise<Parte> {
    const parte = await this.parteRepository.findOne({
      where: { id },
      withDeleted: includeInactive,
      relations: ['categoria', 'marca', 'inventarios'],
    });

    if (!parte || (!includeInactive && !parte.estado)) {
      throw new NotFoundException('Parte no encontrada');
    }

    return parte;
  }

  async update(id: number, updateDto: UpdateParteDto): Promise<Parte> {
    const parte = await this.findOne(id, true);

    if (updateDto.modelo || updateDto.nombre) {
      const whereConditions = [];
      if (updateDto.modelo) whereConditions.push({ modelo: updateDto.modelo });
      if (updateDto.nombre) whereConditions.push({ nombre: updateDto.nombre });

      const duplicado = await this.parteRepository.findOne({
        where: whereConditions,
        withDeleted: true,
      });

      if (duplicado && duplicado.id !== id) {
        if (duplicado.modelo === updateDto.modelo) {
          throw new BadRequestException('Ya existe una parte con ese modelo');
        }
        if (duplicado.nombre === updateDto.nombre) {
          throw new BadRequestException('Ya existe una parte con ese nombre');
        }
      }
    }

    if (updateDto.categoriaId) {
      const categoria = await this.categoriaRepository.findOne({ 
        where: { id: updateDto.categoriaId } 
      });
      if (!categoria) {
        throw new NotFoundException('Categoría no encontrada');
      }
      parte.categoria = categoria;
    }

    if (updateDto.marcaId) {
      const marca = await this.marcaRepository.findOne({ 
        where: { id: updateDto.marcaId } 
      });
      if (!marca) {
        throw new NotFoundException('Marca no encontrada');
      }
      parte.marca = marca;
    }

    if (updateDto.nombre) {
      parte.nombre = updateDto.nombre;
    }

    if (updateDto.modelo) {
      parte.modelo = updateDto.modelo;
    }

    if (updateDto.descripcion) {
      parte.descripcion = updateDto.descripcion;
    }

    if (updateDto.codigoInterno !== undefined) {
      parte.codigoInterno = updateDto.codigoInterno?.trim() || null;
    }

    if (updateDto.precioReferencia !== undefined) {
      parte.precioReferencia = Number(updateDto.precioReferencia ?? 0);
    }

    if (updateDto.estado !== undefined) {
      parte.estado = updateDto.estado;
    }

    await this.parteRepository.save(parte);

    if (!parte.codigoInterno?.trim()) {
      parte.codigoInterno = this.buildCodigoInterno(parte);
      await this.parteRepository.save(parte);
    }

    return this.findOne(id, true);
  }

  async remove(id: number): Promise<{ message: string }> {
    const parte = await this.findOne(id);
    
    // Soft delete con TypeORM
    await this.parteRepository.softRemove(parte);
    
    // Además marcamos como inactivo
    parte.estado = false;
    await this.parteRepository.save(parte);
    
    return { message: `Parte con ID ${id} deshabilitada (soft delete).` };
  }

  async restore(id: number): Promise<{ message: string }> {
    const parte = await this.findOne(id, true);

    if (!parte.deletedAt) {
      throw new BadRequestException('La parte no está eliminada');
    }

    // Restauramos el soft delete
    await this.parteRepository.restore(id);
    
    // Lo marcamos como activo
    parte.estado = true;
    await this.parteRepository.save(parte);
    
    return { message: `Parte con ID ${id} restaurada.` };
  }

  async findAllPaginated(
    page: number,
    limit: number,
    search?: string,
    includeInactive = false,
  ): Promise<{ data: Parte[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = this.parteRepository.createQueryBuilder('parte')
      .leftJoinAndSelect('parte.categoria', 'categoria')
      .leftJoinAndSelect('parte.marca', 'marca')
      .leftJoinAndSelect('parte.inventarios', 'inventarios');

    if (search) {
      query.where(
        `LOWER(parte.nombre) LIKE LOWER(:search)
         OR LOWER(parte.modelo) LIKE LOWER(:search)
         OR LOWER(parte.descripcion) LIKE LOWER(:search)
         OR LOWER(COALESCE(parte.codigoInterno, '')) LIKE LOWER(:search)`,
        { search: `%${search}%` }
      );
    }

    if (!includeInactive) {
      query.andWhere('parte.estado = :estado', { estado: true })
           .andWhere('parte.deletedAt IS NULL');
    }

    query.skip(skip)
      .take(limit)
      .orderBy('parte.nombre', 'ASC');

    const [data, total] = await query.getManyAndCount();

    return { data, total };
  }

  async toggleStatus(id: number): Promise<Parte> {
    const parte = await this.findOne(id, true);
    
    parte.estado = !parte.estado;
    await this.parteRepository.save(parte);
    
    return this.findOne(id, true);
  }
}