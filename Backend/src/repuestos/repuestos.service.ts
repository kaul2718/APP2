import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException, HttpStatus, HttpException } from '@nestjs/common';
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
  ) { }

  // Crear un nuevo repuesto
  async create(CreateRepuestoDto: CreateRepuestoDto): Promise<Repuesto> {
    const { codigo } = CreateRepuestoDto;

    // Validar si ya existe un repuesto con el mismo código
    const existingRepuesto = await this.repuestoRepository.findOne({ where: { codigo } });
    if (existingRepuesto) {
      throw new BadRequestException(`Ya existe un repuesto con el código ${codigo}.`);
    }

    const repuesto = this.repuestoRepository.create(CreateRepuestoDto);
    try {
      return await this.repuestoRepository.save(repuesto);
    } catch (error) {
      throw new InternalServerErrorException(
        `Ocurrió un error al crear el repuesto: ${error.message}`,
      );
    }
  }

  // Obtener todos los repuestos
  async findAll(): Promise<Repuesto[]> {
    try {
      return await this.repuestoRepository.find();
    } catch (error) {
      throw new InternalServerErrorException(
        `Ocurrió un error al obtener los repuestos: ${error.message}`,
      );
    }
  }

  // Obtener un repuesto por ID
  async findOne(id: number): Promise<Repuesto> {
    if (isNaN(id)) {
      throw new BadRequestException('El ID debe ser un número válido.');
    }

    const repuesto = await this.repuestoRepository.findOne({ where: { id } });
    if (!repuesto) {
      throw new NotFoundException(`Repuesto con ID ${id} no encontrado.`);
    }

    return repuesto;
  }

  // Actualizar un repuesto
  async update(id: number, updateRepuestoDto: UpdateRepuestoDto): Promise<Repuesto> {
    if (isNaN(id)) {
      throw new BadRequestException('El ID debe ser un número válido.');
    }

    // Verificar si el repuesto existe antes de intentar actualizarlo
    const repuesto = await this.repuestoRepository.preload({
      id,
      ...updateRepuestoDto,
    });

    if (!repuesto) {
      throw new NotFoundException(`No se ha encontrado el repuesto con ID ${id}`);
    }

    try {
      return await this.repuestoRepository.save(repuesto);
    } catch (error) {
      throw new InternalServerErrorException(
        `Ocurrió un error al intentar actualizar el repuesto: ${error.message}`,
      );
    }
  }

  // Eliminar un repuesto
  async remove(id: number): Promise<{ message: string }> {
    // Verificar si el ID es válido
    if (isNaN(id)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }

    // Buscar el repuesto por ID
    const repuesto = await this.repuestoRepository.findOne({
      where: { id },
    });

    // Verificar si el repuesto existe
    if (!repuesto) {
      throw new NotFoundException(`Repuesto con ID ${id} no encontrado.`);
    }

    try {
      // Eliminar el repuesto
      await this.repuestoRepository.remove(repuesto);

      // Retornar un mensaje de éxito
      return { message: `Repuesto con ID ${id} eliminado con éxito.` };
    } catch (error) {
      throw new InternalServerErrorException(
        `Ocurrió un error al intentar eliminar el repuesto: ${error.message}`,
      );
    }
  }
}

