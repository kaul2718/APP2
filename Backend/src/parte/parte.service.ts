import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Parte } from './entities/parte.entity';
import { Categoria } from '../categoria/entities/categoria.entity';
import { Marca } from '../marca/entities/marca.entity';
import { CreateParteDto } from './dto/create-parte.dto';
import { UpdateParteDto } from './dto/update-parte.dto';
import { NotificacionService } from '../notificacion/notificacion.service';

@Injectable()
export class ParteService {
  constructor(
    @InjectRepository(Parte)
    private readonly parteRepository: Repository<Parte>,
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
    @InjectRepository(Marca)
    private readonly marcaRepository: Repository<Marca>,
    private readonly notificacionService: NotificacionService,
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
    // 1. Validaciones Pro: Precios vs Costo
    if (createDto.precio1 < createDto.costo) {
      throw new BadRequestException('El precio de venta 1 no puede ser inferior al costo');
    }

    // 2. Verificar duplicados por Nombre o Código Interno
    if (createDto.codigoInterno) {
        const existeCodigo = await this.parteRepository.findOne({
            where: { codigoInterno: createDto.codigoInterno },
            withDeleted: true
        });
        if (existeCodigo) throw new BadRequestException('El código interno ya está registrado');
    }

    const existeNombre = await this.parteRepository.findOne({
      where: { nombre: createDto.nombre },
      withDeleted: true,
    });
    if (existeNombre) throw new BadRequestException('Ya existe un item con ese nombre');

    // 3. Verificar Relaciones
    const categoria = await this.categoriaRepository.findOne({ where: { id: createDto.categoriaId } });
    if (!categoria) throw new NotFoundException('Categoría no encontrada');

    const marca = await this.marcaRepository.findOne({ where: { id: createDto.marcaId } });
    if (!marca) throw new NotFoundException('Marca no encontrada');

    // 4. Mapeo y Creación
    const nuevo = this.parteRepository.create({
      ...createDto,
      categoria,
      marca,
    });

    const parteGuardada = await this.parteRepository.save(nuevo);

    // Auto-generar código si no viene
    if (!parteGuardada.codigoInterno?.trim()) {
      parteGuardada.codigoInterno = this.buildCodigoInterno(parteGuardada);
      await this.parteRepository.save(parteGuardada);
    }

    // Alerta de stock bajo si aplica al crear
    await this.notificacionService.checkAndNotificarStockBajo(parteGuardada.id);

    return this.findOne(parteGuardada.id, true);
  }

  findAll(includeInactive = false): Promise<Parte[]> {
    return this.parteRepository.find({
      where: includeInactive ? {} : { estado: true },
      withDeleted: includeInactive,
      relations: ['categoria', 'marca'],
      order: { nombre: 'ASC' }
    });
  }

  async findOne(id: number, includeInactive = false): Promise<Parte> {
    const parte = await this.parteRepository.findOne({
      where: { id },
      withDeleted: includeInactive,
      relations: ['categoria', 'marca'],
    });

    if (!parte || (!includeInactive && !parte.estado)) {
      throw new NotFoundException('Item de almacén no encontrado');
    }

    return parte;
  }

  async update(id: number, updateDto: UpdateParteDto): Promise<Parte> {
    const parte = await this.findOne(id, true);

    // Validaciones de Precios si se envían
    const finalCosto = updateDto.costo ?? parte.costo;
    if (updateDto.precio1 !== undefined && updateDto.precio1 < finalCosto) {
        throw new BadRequestException('El precio de venta 1 no puede ser inferior al costo');
    }

    // Verificar Duplicados
    if (updateDto.nombre && updateDto.nombre !== parte.nombre) {
      const duplicado = await this.parteRepository.findOne({ where: { nombre: updateDto.nombre }, withDeleted: true });
      if (duplicado) throw new BadRequestException('Ya existe un item con ese nombre');
    }

    if (updateDto.codigoInterno && updateDto.codigoInterno !== parte.codigoInterno) {
        const duplicado = await this.parteRepository.findOne({ where: { codigoInterno: updateDto.codigoInterno }, withDeleted: true });
        if (duplicado) throw new BadRequestException('El código interno ya está registrado');
    }

    // Actualizar Relaciones
    if (updateDto.categoriaId) {
      const categoria = await this.categoriaRepository.findOne({ where: { id: updateDto.categoriaId } });
      if (!categoria) throw new NotFoundException('Categoría no encontrada');
      parte.categoria = categoria;
    }

    if (updateDto.marcaId) {
      const marca = await this.marcaRepository.findOne({ where: { id: updateDto.marcaId } });
      if (!marca) throw new NotFoundException('Marca no encontrada');
      parte.marca = marca;
    }

    // Actualizar Campos
    Object.assign(parte, updateDto);

    await this.parteRepository.save(parte);

    if (!parte.codigoInterno?.trim()) {
      parte.codigoInterno = this.buildCodigoInterno(parte);
      await this.parteRepository.save(parte);
    }

    // Alerta de stock bajo si aplica al actualizar
    await this.notificacionService.checkAndNotificarStockBajo(parte.id);

    return this.findOne(id, true);
  }

  async remove(id: number): Promise<{ message: string }> {
    const parte = await this.findOne(id);
    await this.parteRepository.softRemove(parte);
    parte.estado = false;
    await this.parteRepository.save(parte);
    return { message: `Item con ID ${id} deshabilitado.` };
  }

  async restore(id: number): Promise<{ message: string }> {
    const parte = await this.findOne(id, true);
    if (!parte.deletedAt) throw new BadRequestException('El item no está eliminado');
    await this.parteRepository.restore(id);
    parte.estado = true;
    await this.parteRepository.save(parte);
    return { message: `Item con ID ${id} restaurado.` };
  }

  async findAllPaginated(
    page: any,
    limit: any,
    search?: string,
    includeInactive = false,
    unidadMedida?: string,
    isNotServicio?: boolean,
  ): Promise<{ data: Parte[]; total: number }> {
    const limitNum = Number(limit) || 10;
    const pageNum = Number(page) || 1;
    const skip = (pageNum - 1) * limitNum;

    try {
        const query = this.parteRepository.createQueryBuilder('parte')
            .leftJoinAndSelect('parte.categoria', 'categoria')
            .leftJoinAndSelect('parte.marca', 'marca');

        if (includeInactive) {
            query.withDeleted();
        }

        if (search) {
            query.andWhere(
                `(LOWER(parte.nombre) LIKE LOWER(:search)
                 OR LOWER(parte.modelo) LIKE LOWER(:search)
                 OR LOWER(parte.descripcion) LIKE LOWER(:search))`,
                { search: `%${search}%` }
            );
        }

        if (unidadMedida) {
            query.andWhere('parte.unidadMedida = :unidadMedida', { unidadMedida });
        }

        if (isNotServicio) {
            query.andWhere('parte.unidadMedida != :serv', { serv: 'Servicio' });
        }

        if (!includeInactive) {
            query.andWhere('parte.estado = :estado', { estado: true });
        }

        query.skip(skip)
            .take(limitNum)
            .orderBy('parte.nombre', 'ASC');

        const [data, total] = await query.getManyAndCount();

        return { data, total };
    } catch (error) {
        console.error('Error en findAllPaginated:', error);
        throw new BadRequestException('Error al consultar el almacén. Verifique la conexión o el esquema de base de datos.');
    }
  }

  async toggleStatus(id: number): Promise<Parte> {
    const parte = await this.findOne(id, true);
    parte.estado = !parte.estado;
    await this.parteRepository.save(parte);
    return this.findOne(id, true);
  }
}