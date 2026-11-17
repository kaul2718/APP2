import { Injectable, BadRequestException, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Parte } from './entities/parte.entity';
import { Categoria } from '../categoria/entities/categoria.entity';
import { Marca } from '../marca/entities/marca.entity';
import { CreateParteDto } from './dto/create-parte.dto';
import { UpdateParteDto } from './dto/update-parte.dto';
import { NotificacionService } from '../notificacion/notificacion.service';
import { AuditService } from '../audit/audit.service';

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
    @Optional() private readonly auditService?: AuditService,
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

    let marca: Marca | null = null;
    if (createDto.marcaId && createDto.marcaId > 0) {
      marca = await this.marcaRepository.findOne({ where: { id: createDto.marcaId } });
      if (!marca) throw new NotFoundException('Marca no encontrada');
    }

    // 4. Mapeo y Creación
    const nuevo = this.parteRepository.create({
      ...createDto,
      categoria,
      marca: marca || undefined,
      marcaId: marca ? marca.id : undefined,
    });

    const parteGuardada = await this.parteRepository.manager.transaction(async (manager) => {
      const parteRepo = manager.getRepository(Parte);
      const saved = await parteRepo.save(nuevo);

      // Auto-generar código si no viene
      if (!saved.codigoInterno?.trim()) {
        saved.codigoInterno = this.buildCodigoInterno(saved);
        await parteRepo.save(saved);
      }

      await this.auditService?.logCritical(
        {
          action: 'CATALOG_ITEM_CREATED',
          module: 'inventario',
          entityType: 'Parte',
          entityId: saved.id,
          description: `Ítem de catálogo creado: ${saved.nombre} (costo: $${Number(saved.costo || 0).toFixed(2)}, precio1: $${Number(saved.precio1 || 0).toFixed(2)})`,
          newValues: {
            nombre: saved.nombre,
            codigoInterno: saved.codigoInterno,
            costo: Number(saved.costo || 0),
            precio1: Number(saved.precio1 || 0),
            precio2: saved.precio2 !== undefined && saved.precio2 !== null ? Number(saved.precio2) : null,
            precio3: saved.precio3 !== undefined && saved.precio3 !== null ? Number(saved.precio3) : null,
            stock: Number(saved.stock || 0),
            unidadMedida: saved.unidadMedida,
          },
          status: 'SUCCESS',
        },
        manager,
      );

      return saved;
    });

    // Post-commit: Alerta de stock bajo si aplica al crear
    this.notificacionService.checkAndNotificarStockBajo(parteGuardada.id).catch(() => null);

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

    const oldSnapshot = {
      nombre: parte.nombre,
      codigoInterno: parte.codigoInterno,
      costo: Number(parte.costo || 0),
      precio1: Number(parte.precio1 || 0),
      precio2: parte.precio2 !== undefined && parte.precio2 !== null ? Number(parte.precio2) : null,
      precio3: parte.precio3 !== undefined && parte.precio3 !== null ? Number(parte.precio3) : null,
      stock: Number(parte.stock || 0),
      estado: parte.estado,
    };

    // Actualizar Campos en memoria
    Object.assign(parte, updateDto);

    await this.parteRepository.manager.transaction(async (manager) => {
      const parteRepo = manager.getRepository(Parte);
      await parteRepo.save(parte);

      if (!parte.codigoInterno?.trim()) {
        parte.codigoInterno = this.buildCodigoInterno(parte);
        await parteRepo.save(parte);
      }

      const newSnapshot = {
        nombre: parte.nombre,
        codigoInterno: parte.codigoInterno,
        costo: Number(parte.costo || 0),
        precio1: Number(parte.precio1 || 0),
        precio2: parte.precio2 !== undefined && parte.precio2 !== null ? Number(parte.precio2) : null,
        precio3: parte.precio3 !== undefined && parte.precio3 !== null ? Number(parte.precio3) : null,
        stock: Number(parte.stock || 0),
        estado: parte.estado,
      };

      const economicChanged =
        oldSnapshot.costo !== newSnapshot.costo ||
        oldSnapshot.precio1 !== newSnapshot.precio1 ||
        oldSnapshot.precio2 !== newSnapshot.precio2 ||
        oldSnapshot.precio3 !== newSnapshot.precio3 ||
        oldSnapshot.stock !== newSnapshot.stock;

      await this.auditService?.logCritical(
        {
          action: economicChanged ? 'CATALOG_ITEM_PRICE_UPDATED' : 'CATALOG_ITEM_UPDATED',
          module: 'inventario',
          entityType: 'Parte',
          entityId: parte.id,
          description: `Ítem de catálogo #${parte.id} (${parte.nombre}) actualizado`,
          oldValues: oldSnapshot,
          newValues: newSnapshot,
          status: 'SUCCESS',
        },
        manager,
      );
    });

    // Post-commit: Alerta de stock bajo si aplica al actualizar
    this.notificacionService.checkAndNotificarStockBajo(parte.id).catch(() => null);

    return this.findOne(id, true);
  }

  async remove(id: number): Promise<{ message: string }> {
    const parte = await this.findOne(id);
    await this.parteRepository.manager.transaction(async (manager) => {
      const parteRepo = manager.getRepository(Parte);
      await parteRepo.softRemove(parte);
      parte.estado = false;
      await parteRepo.save(parte);

      await this.auditService?.logCritical(
        {
          action: 'CATALOG_ITEM_DEACTIVATED',
          module: 'inventario',
          entityType: 'Parte',
          entityId: parte.id,
          description: `Ítem de catálogo #${parte.id} (${parte.nombre}) deshabilitado`,
          oldValues: { estado: true },
          newValues: { estado: false },
          status: 'SUCCESS',
        },
        manager,
      );
    });
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
    const prevEstado = parte.estado;
    await this.parteRepository.manager.transaction(async (manager) => {
      parte.estado = !parte.estado;
      await manager.getRepository(Parte).save(parte);
      await this.auditService?.logCritical(
        {
          action: 'CATALOG_ITEM_STATUS_TOGGLED',
          module: 'inventario',
          entityType: 'Parte',
          entityId: parte.id,
          description: `Estado de ítem #${parte.id} (${parte.nombre}) cambiado de ${prevEstado ? 'Activo' : 'Inactivo'} a ${parte.estado ? 'Activo' : 'Inactivo'}`,
          oldValues: { estado: prevEstado },
          newValues: { estado: parte.estado },
          status: 'SUCCESS',
        },
        manager,
      );
    });
    return this.findOne(id, true);
  }
}