import {Injectable,NotFoundException,InternalServerErrorException,BadRequestException,} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Repuesto } from './entities/repuesto.entity';
import { CreateRepuestoDto } from './dto/create-repuesto.dto';
import { UpdateRepuestoDto } from './dto/update-repuesto.dto';

@Injectable()
export class RepuestosService {
  constructor(
    @InjectRepository(Repuesto)
    private readonly repuestoRepository: Repository<Repuesto>,
  ) {}

  // Crear un nuevo repuesto
  async create(dto: CreateRepuestoDto): Promise<Repuesto> {
    const { codigo } = dto;

    const existing = await this.repuestoRepository.findOne({
      where: { codigo, isDeleted: false },
    });
    if (existing) {
      throw new BadRequestException(`Ya existe un repuesto con el código ${codigo}.`);
    }

    const repuesto = this.repuestoRepository.create(dto);
    return await this.repuestoRepository.save(repuesto);
  }

  // Obtener todos los repuestos (no eliminados)
  async findAll(): Promise<Repuesto[]> {
    return await this.repuestoRepository.find({
      where: { isDeleted: false },
      relations: ['parte'], // opcional
    });
  }

  // Obtener un repuesto por ID (no eliminado)
  async findOne(id: number): Promise<Repuesto> {
    if (isNaN(id)) {
      throw new BadRequestException('El ID debe ser un número válido.');
    }

    const repuesto = await this.repuestoRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['parte'],
    });

    if (!repuesto) {
      throw new NotFoundException(`Repuesto con ID ${id} no encontrado.`);
    }

    return repuesto;
  }

  // Actualizar un repuesto
  async update(id: number, dto: UpdateRepuestoDto): Promise<Repuesto> {
    if (isNaN(id)) {
      throw new BadRequestException('El ID debe ser un número válido.');
    }

    const repuesto = await this.repuestoRepository.preload({
      id,
      ...dto,
    });

    if (!repuesto || repuesto.isDeleted) {
      throw new NotFoundException(`No se ha encontrado el repuesto con ID ${id}`);
    }

    return await this.repuestoRepository.save(repuesto);
  }

  // Eliminar (lógicamente) un repuesto
  async remove(id: number): Promise<{ message: string }> {
    if (isNaN(id)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }

    const repuesto = await this.repuestoRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!repuesto) {
      throw new NotFoundException(`Repuesto con ID ${id} no encontrado.`);
    }

    repuesto.isDeleted = true;
    repuesto.deletedAt = new Date();
    await this.repuestoRepository.save(repuesto);

    return { message: `Repuesto con ID ${id} eliminado con éxito (soft delete).` };
  }
}
