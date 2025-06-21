import { Injectable, NotFoundException, BadRequestException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EspecificacionParte } from './entities/especificacion-parte.entity';
import { CreateEspecificacionParteDto } from './dto/create-especificacion-parte.dto';
import { UpdateEspecificacionParteDto } from './dto/update-especificacion-parte.dto';

@Injectable()
export class EspecificacionParteService {
  constructor(
    @InjectRepository(EspecificacionParte)
    private readonly repo: Repository<EspecificacionParte>,
  ) { }

  async create(dto: CreateEspecificacionParteDto): Promise<EspecificacionParte> {
    const exists = await this.repo.findOne({
      where: {
        parte: { id: dto.parteId },
        tipoEspecificacion: { id: dto.tipoEspecificacionId },
      },
      relations: ['parte', 'tipoEspecificacion'],
    });

    if (exists) {
      throw new BadRequestException(
        'Ya existe una especificación con ese tipo para esta parte.',
      );
    }

    const especificacion = this.repo.create({
      valor: dto.valor,
      parte: { id: dto.parteId } as any,
      tipoEspecificacion: { id: dto.tipoEspecificacionId } as any,
    });

    return this.repo.save(especificacion);
  }

  async findAll(): Promise<EspecificacionParte[]> {
    return this.repo.find({
      where: { isDeleted: false },
      relations: ['parte', 'tipoEspecificacion'],
    });
  }


  async findOne(id: number): Promise<EspecificacionParte> {
    const especificacion = await this.repo.findOne({
      where: { id, isDeleted: false },
      relations: ['parte', 'tipoEspecificacion'],
    });

    if (!especificacion) {
      throw new NotFoundException(`Especificación con ID ${id} no encontrada o ya eliminada.`);
    }

    return especificacion;
  }

  async update(
    id: number,
    dto: UpdateEspecificacionParteDto,
  ): Promise<EspecificacionParte> {
    const especificacion = await this.findOne(id);

    if (dto.parteId) {
      especificacion.parte = { id: dto.parteId } as any;
    }

    if (dto.tipoEspecificacionId) {
      especificacion.tipoEspecificacion = { id: dto.tipoEspecificacionId } as any;
    }

    if (dto.valor) {
      especificacion.valor = dto.valor;
    }

    return this.repo.save(especificacion);
  }

  async remove(id: number): Promise<{ message: string }> {
    const especificacion = await this.findOne(id);

    if (especificacion.isDeleted) {
      throw new BadRequestException('La especificación ya fue eliminada.');
    }

    especificacion.isDeleted = true;
    especificacion.deletedAt = new Date();

    await this.repo.save(especificacion);

    return { message: `La especificación con ID ${id} fue eliminada correctamente (soft delete).` };
  }
  async restore(id: number): Promise<{ message: string }> {
    const especificacion = await this.repo.findOne({
      where: { id, isDeleted: true },
    });

    if (!especificacion) {
      throw new NotFoundException(`No se encontró una especificación eliminada con el ID ${id}.`);
    }

    especificacion.isDeleted = false;
    especificacion.deletedAt = null;

    await this.repo.save(especificacion);

    return { message: `Especificación con ID ${id} restaurada correctamente.` };
  }
}
