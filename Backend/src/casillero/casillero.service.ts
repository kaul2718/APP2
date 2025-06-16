import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { CreateCasilleroDto } from './dto/create-casillero.dto';
import { UpdateCasilleroDto } from './dto/update-casillero.dto';
import { Casillero } from './entities/casillero.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class CasilleroService {
  constructor(
    @InjectRepository(Casillero)
    private readonly casilleroRepository: Repository<Casillero>,
  ) {}

  async create(createCasilleroDto: CreateCasilleroDto): Promise<Casillero> {
    const { numero } = createCasilleroDto;
    const existingCasillero = await this.casilleroRepository.findOne({ where: { numero } });
    if (existingCasillero) {
      throw new BadRequestException(`El casillero con número "${numero}" ya existe.`);
    }
    const casillero = this.casilleroRepository.create(createCasilleroDto);
    return await this.casilleroRepository.save(casillero);
  }

  async findAll(): Promise<Casillero[]> {
    return this.casilleroRepository.find();
  }

  async findOneByNumero(numero: string): Promise<Casillero> {
    if (!numero) {
      throw new BadRequestException('El número de casillero proporcionado no es válido.');
    }
    const casillero = await this.casilleroRepository.findOne({ where: { numero } });
    if (!casillero) {
      throw new NotFoundException(`Casillero con número ${numero} no encontrado.`);
    }
    return casillero;
  }

  async update(numero: string, updateCasilleroDto: UpdateCasilleroDto): Promise<Casillero> {
    const casillero = await this.findOneByNumero(numero);
    Object.assign(casillero, updateCasilleroDto);
    return await this.casilleroRepository.save(casillero);
  }

  async remove(numero: string): Promise<void> {
    const casillero = await this.findOneByNumero(numero);
    await this.casilleroRepository.remove(casillero);
  }
}