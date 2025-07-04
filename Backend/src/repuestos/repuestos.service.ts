import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Repuesto } from './entities/repuesto.entity';
import { Parte } from '../parte/entities/parte.entity';
import { DetalleRepuestos } from '../detalle-repuestos/entities/detalle-repuesto.entity';
import { CreateRepuestoDto } from './dto/create-repuesto.dto';
import { UpdateRepuestoDto } from './dto/update-repuesto.dto';

@Injectable()
export class RepuestosService {
  constructor(
    @InjectRepository(Repuesto)
    private readonly repuestoRepository: Repository<Repuesto>,
    @InjectRepository(Parte)
    private readonly parteRepository: Repository<Parte>,
    @InjectRepository(DetalleRepuestos)
    private readonly detalleRepuestoRepository: Repository<DetalleRepuestos>,
  ) { }

  async create(createDto: CreateRepuestoDto): Promise<Repuesto> {
    // Verificar si ya existe un repuesto con el mismo código
    const existeCodigo = await this.repuestoRepository.findOne({
      where: { codigo: createDto.codigo },
      withDeleted: true,
    });

    if (existeCodigo) {
      throw new BadRequestException('Ya existe un repuesto con ese código');
    }

    // Verificar si la parte existe
    const parte = await this.parteRepository.findOne({ 
      where: { id: createDto.parteId } 
    });
    if (!parte) {
      throw new NotFoundException('Parte no encontrada');
    }

    // Crear el nuevo repuesto
    const nuevo = this.repuestoRepository.create({
      codigo: createDto.codigo,
      nombre: createDto.nombre,
      descripcion: createDto.descripcion,
      precioVenta: createDto.precioVenta,
      parte,
      estado: true, // Por defecto se crea como activo
    });

    return this.repuestoRepository.save(nuevo);
  }

  findAll(includeInactive = false): Promise<Repuesto[]> {
    return this.repuestoRepository.find({
      where: includeInactive ? {} : { estado: true },
      withDeleted: includeInactive,
      relations: ['parte', 'detallesRepuestos'],
    });
  }

  async findOne(id: number, includeInactive = false): Promise<Repuesto> {
    const repuesto = await this.repuestoRepository.findOne({
      where: { id },
      withDeleted: includeInactive,
      relations: ['parte', 'detallesRepuestos'],
    });

    if (!repuesto || (!includeInactive && !repuesto.estado)) {
      throw new NotFoundException('Repuesto no encontrado');
    }

    return repuesto;
  }

  async update(id: number, updateDto: UpdateRepuestoDto): Promise<Repuesto> {
    const repuesto = await this.findOne(id, true);

    // Verificar si se está cambiando el código y si ya existe
    if (updateDto.codigo && updateDto.codigo !== repuesto.codigo) {
      const existeCodigo = await this.repuestoRepository.findOne({
        where: { codigo: updateDto.codigo },
        withDeleted: true,
      });

      if (existeCodigo) {
        throw new BadRequestException('Ya existe un repuesto con ese código');
      }
      repuesto.codigo = updateDto.codigo;
    }

    // Actualizar la parte si se proporciona parteId
    if (updateDto.parteId) {
      const parte = await this.parteRepository.findOne({ 
        where: { id: updateDto.parteId } 
      });
      if (!parte) {
        throw new NotFoundException('Parte no encontrada');
      }
      repuesto.parte = parte;
    }

    // Actualizar otros campos
    if (updateDto.nombre) {
      repuesto.nombre = updateDto.nombre;
    }

    if (updateDto.descripcion) {
      repuesto.descripcion = updateDto.descripcion;
    }

    if (updateDto.precioVenta) {
      repuesto.precioVenta = updateDto.precioVenta;
    }

    if (updateDto.estado !== undefined) {
      repuesto.estado = updateDto.estado;
    }

    return this.repuestoRepository.save(repuesto);
  }

  async remove(id: number): Promise<{ message: string }> {
    const repuesto = await this.findOne(id);
    
    // Verificar si el repuesto está siendo usado en algún detalle
    const detalles = await this.detalleRepuestoRepository.find({
      where: { repuesto: { id } },
    });

    if (detalles.length > 0) {
      throw new BadRequestException('No se puede eliminar el repuesto porque está siendo utilizado en órdenes de trabajo');
    }

    // Soft delete con TypeORM
    await this.repuestoRepository.softRemove(repuesto);
    
    // Además marcamos como inactivo
    repuesto.estado = false;
    await this.repuestoRepository.save(repuesto);
    
    return { message: `Repuesto con ID ${id} deshabilitado (soft delete).` };
  }

  async restore(id: number): Promise<{ message: string }> {
    const repuesto = await this.findOne(id, true);

    if (!repuesto.deletedAt) {
      throw new BadRequestException('El repuesto no está eliminado');
    }

    // Restauramos el soft delete
    await this.repuestoRepository.restore(id);
    
    // Lo marcamos como activo
    repuesto.estado = true;
    await this.repuestoRepository.save(repuesto);
    
    return { message: `Repuesto con ID ${id} restaurado.` };
  }

  async findAllPaginated(
    page: number,
    limit: number,
    search?: string,
    includeInactive = false,
  ): Promise<{ data: Repuesto[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = this.repuestoRepository.createQueryBuilder('repuesto')
      .leftJoinAndSelect('repuesto.parte', 'parte')
      .leftJoinAndSelect('repuesto.detallesRepuestos', 'detallesRepuestos');

    if (search) {
      query.where('(LOWER(repuesto.codigo) LIKE LOWER(:search) OR LOWER(repuesto.nombre) LIKE LOWER(:search))', { 
        search: `%${search}%` 
      });
    }

    if (!includeInactive) {
      query.andWhere('repuesto.estado = :estado', { estado: true })
           .andWhere('repuesto.deletedAt IS NULL');
    }

    query.skip(skip)
      .take(limit)
      .orderBy('repuesto.nombre', 'ASC');

    const [data, total] = await query.getManyAndCount();

    return { data, total };
  }

  async toggleStatus(id: number): Promise<Repuesto> {
    const repuesto = await this.findOne(id, true);
    
    repuesto.estado = !repuesto.estado;
    await this.repuestoRepository.save(repuesto);
    
    return repuesto;
  }

  async findByCodigo(codigo: string, includeInactive = false): Promise<Repuesto> {
    const repuesto = await this.repuestoRepository.findOne({
      where: { codigo },
      withDeleted: includeInactive,
      relations: ['parte', 'detallesRepuestos'],
    });

    if (!repuesto || (!includeInactive && !repuesto.estado)) {
      throw new NotFoundException(`Repuesto con código ${codigo} no encontrado`);
    }

    return repuesto;
  }
}