import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from './entities/categoria.entity';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';

@Injectable()
export class CategoriaService {
  constructor(
    @InjectRepository(Categoria)
    private readonly repo: Repository<Categoria>,
  ) {}

  create(dto: CreateCategoriaDto) {
    const nueva = this.repo.create(dto);
    return this.repo.save(nueva);
  }

  findAll() {
    return this.repo.find({ where: { isDeleted: false } });
  }

  async findOne(id: number) {
    const cat = await this.repo.findOne({ where: { id, isDeleted: false } });
    if (!cat) throw new NotFoundException('Categoría no encontrada');
    return cat;
  }

  async update(id: number, dto: UpdateCategoriaDto) {
    const cat = await this.findOne(id);
    Object.assign(cat, dto);
    return this.repo.save(cat);
  }

  async remove(id: number) {
    const cat = await this.findOne(id);
    cat.isDeleted = true;
    cat.deletedAt = new Date();
    return this.repo.save(cat);
  }
}
