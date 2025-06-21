import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventario } from './entities/inventario.entity';
import { CreateInventarioDto } from './dto/create-inventario.dto';
import { UpdateInventarioDto } from './dto/update-inventario.dto';

@Injectable()
export class InventarioService {
  constructor(
    @InjectRepository(Inventario)
    private readonly repo: Repository<Inventario>,
  ) { }

  async create(dto: CreateInventarioDto): Promise<Inventario> {
    const inventario = this.repo.create(dto);
    return await this.repo.save(inventario);
  }

  async findAll(): Promise<Inventario[]> {
    return await this.repo.find({
      where: { isDeleted: false },
    });
  }

  async findOne(id: number): Promise<Inventario> {
    const inv = await this.repo.findOne({
      where: { id, isDeleted: false },
    });
    if (!inv) throw new NotFoundException('Inventario no encontrado');
    return inv;
  }

  async update(id: number, dto: UpdateInventarioDto): Promise<Inventario> {
    const inv = await this.findOne(id);
    Object.assign(inv, dto);
    return await this.repo.save(inv);
  }


  async remove(id: number): Promise<{ message: string }> {
    const inv = await this.findOne(id);

    inv.isDeleted = true;
    inv.deletedAt = new Date();

    await this.repo.save(inv);
    return { message: `Inventario con ID ${id} eliminado (soft delete)` };
  }

  async findEliminados(): Promise<Inventario[]> {
    return await this.repo.find({
      where: { isDeleted: true },
      relations: ['parte'],
    });
  }
  async restore(id: number): Promise<Inventario> {
    const entity = await this.repo.findOne({ where: { id, isDeleted: true } });

    if (!entity) {
      throw new NotFoundException(`Inventario eliminado con id ${id} no encontrado.`);
    }

    entity.isDeleted = false;
    entity.deletedAt = null;
    return await this.repo.save(entity);
  }
}
