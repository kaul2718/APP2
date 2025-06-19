import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Parte } from './entities/parte.entity';
import { CreateParteDto } from './dto/create-parte.dto';
import { UpdateParteDto } from './dto/update-parte.dto';

@Injectable()
export class ParteService {
  constructor(
    @InjectRepository(Parte)
    private readonly parteRepository: Repository<Parte>,
  ) { }

  async create(dto: CreateParteDto): Promise<Parte> {
    const existing = await this.parteRepository.findOne({
      where: {
        modelo: dto.modelo,
        isDeleted: false,
      },
    });

    if (existing) {
      throw new BadRequestException('Ya existe una parte con ese modelo.');
    }

    const parte = this.parteRepository.create(dto);
    return await this.parteRepository.save(parte);
  }

  async findAll(): Promise<Parte[]> {
    return this.parteRepository.find({
      where: { isDeleted: false },
      relations: ['categoria', 'marca', 'especificaciones'],
    });
  }


  async findOne(id: number): Promise<Parte> {
    const parte = await this.parteRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['categoria', 'marca', 'especificaciones'],
    });

    if (!parte) {
      throw new NotFoundException(`No se encontró la parte con ID ${id} o ya está eliminada.`);
    }

    return parte;
  }


  async update(id: number, dto: UpdateParteDto): Promise<Parte> {
    const parte = await this.findOne(id); // ya filtra por isDeleted: false

    Object.assign(parte, dto);

    return await this.parteRepository.save(parte);
  }


  async remove(id: number): Promise<{ message: string }> {
    const parte = await this.findOne(id);

    parte.isDeleted = true;
    parte.deletedAt = new Date();

    await this.parteRepository.save(parte);

    return { message: `Parte con ID ${id} eliminada (soft delete)` };
  }

  async softDelete(id: number): Promise<void> {
    const parte = await this.parteRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!parte) {
      throw new NotFoundException(`No se encontró la parte con ID ${id} o ya está eliminada.`);
    }

    parte.isDeleted = true;
    parte.deletedAt = new Date();

    await this.parteRepository.save(parte);
  }

}