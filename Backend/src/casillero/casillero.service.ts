import {Injectable,NotFoundException,InternalServerErrorException,BadRequestException,} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Casillero } from './entities/casillero.entity';
import { CreateCasilleroDto } from './dto/create-casillero.dto';
import { UpdateCasilleroDto } from './dto/update-casillero.dto';
import { EstadoCasillero } from '../common/enums/estadoCasillero.enum';

@Injectable()
export class CasilleroService {
  constructor(
    @InjectRepository(Casillero)
    private readonly casilleroRepository: Repository<Casillero>,
  ) {}

  async create(createCasilleroDto: CreateCasilleroDto): Promise<Casillero> {
    const { numero } = createCasilleroDto;
    const existingCasillero = await this.casilleroRepository.findOne({
      where: { numero, isDeleted: false },
    });

    if (existingCasillero) {
      throw new BadRequestException(
        `El casillero con número "${numero}" ya existe.`,
      );
    }

    const casillero = this.casilleroRepository.create(createCasilleroDto);
    return await this.casilleroRepository.save(casillero);
  }

  async findAll(): Promise<Casillero[]> {
    return this.casilleroRepository.find({
      where: { isDeleted: false },
    });
  }

  async findOneByNumero(numero: string): Promise<Casillero> {
    if (!numero) {
      throw new BadRequestException('El número de casillero proporcionado no es válido.');
    }

    const casillero = await this.casilleroRepository.findOne({
      where: { numero, isDeleted: false },
    });

    if (!casillero) {
      throw new NotFoundException(`Casillero con número ${numero} no encontrado.`);
    }

    return casillero;
  }

  async update(
    numero: string,
    updateCasilleroDto: UpdateCasilleroDto,
  ): Promise<Casillero> {
    const casillero = await this.findOneByNumero(numero);
    Object.assign(casillero, updateCasilleroDto);
    return await this.casilleroRepository.save(casillero);
  }

  async remove(numero: string): Promise<{ message: string }> {
    const casillero = await this.findOneByNumero(numero);

    if (casillero.estado === EstadoCasillero.OCUPADO) {
      throw new BadRequestException('No se puede eliminar un casillero que está ocupado.');
    }

    if (casillero.isDeleted) {
      throw new BadRequestException('El casillero ya ha sido eliminado.');
    }

    casillero.isDeleted = true;
    casillero.deletedAt = new Date();

    await this.casilleroRepository.save(casillero);

    return {
      message: `Casillero ${numero} eliminado correctamente (soft delete).`,
    };
  }

  // Método para liberar un casillero
  async liberarCasillero(numero: string): Promise<Casillero> {
    const casillero = await this.findOneByNumero(numero);

    if (casillero.estado !== EstadoCasillero.OCUPADO) {
      throw new BadRequestException('El casillero no está ocupado.');
    }

    casillero.estado = EstadoCasillero.DISPONIBLE;
    casillero.orderId = null;
    casillero.order = null;

    return this.casilleroRepository.save(casillero);
  }

  // Obtener solo los casilleros disponibles y no eliminados
  async findDisponibles(): Promise<Casillero[]> {
    return this.casilleroRepository.find({
      where: {
        estado: EstadoCasillero.DISPONIBLE,
        isDeleted: false,
      },
    });
  }
}