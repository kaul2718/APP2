import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Proveedor } from './entities/proveedor.entity';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';

@Injectable()
export class ProveedorService {
  constructor(
    @InjectRepository(Proveedor)
    private readonly proveedorRepository: Repository<Proveedor>,
  ) {}

  async create(createProveedorDto: CreateProveedorDto): Promise<Proveedor> {
    const proveedor = this.proveedorRepository.create(createProveedorDto);
    return await this.proveedorRepository.save(proveedor);
  }

  async findAll(query: { limit?: number; page?: number; search?: string }): Promise<{ items: Proveedor[]; total: number }> {
    const limit = query.limit || 10;
    const page = query.page || 1;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      where.nombre = Like(`%${query.search}%`);
    }

    const [items, total] = await this.proveedorRepository.findAndCount({
      where,
      order: { nombre: 'ASC' },
      take: limit,
      skip,
    });

    return { items, total };
  }

  async findActive(): Promise<Proveedor[]> {
    return await this.proveedorRepository.find({
      where: { estado: true },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Proveedor> {
    const proveedor = await this.proveedorRepository.findOneBy({ id });
    if (!proveedor) {
      throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
    }
    return proveedor;
  }

  async update(id: number, updateProveedorDto: UpdateProveedorDto): Promise<Proveedor> {
    const proveedor = await this.findOne(id);
    this.proveedorRepository.merge(proveedor, updateProveedorDto);
    return await this.proveedorRepository.save(proveedor);
  }

  async remove(id: number): Promise<void> {
    const proveedor = await this.findOne(id);
    // Soft delete / toggle state instead of hard delete to keep historical purchases safe
    proveedor.estado = false;
    await this.proveedorRepository.save(proveedor);
  }
}
