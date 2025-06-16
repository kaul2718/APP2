import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Servicio } from './entities/servicio.entity';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';

@Injectable()
export class ServiciosService {
  constructor(
    @InjectRepository(Servicio)
    private readonly servicioRepository: Repository<Servicio>,
  ) {}

  // Crear un nuevo servicio
  async create(createServicioDto: CreateServicioDto): Promise<Servicio> {
    const { codigo } = createServicioDto;

    // Validar que el código no esté repetido
    const existingServicio = await this.servicioRepository.findOne({
      where: { codigo },
    });

    if (existingServicio) {
      throw new BadRequestException(`Ya existe un servicio con el código ${codigo}.`);
    }

    const servicio = this.servicioRepository.create(createServicioDto);

    try {
      return await this.servicioRepository.save(servicio);
    } catch (error) {
      throw new InternalServerErrorException(
        `Ocurrió un error al crear el servicio: ${error.message}`,
      );
    }
  }

  // Obtener todos los servicios
  async findAll(): Promise<Servicio[]> {
    try {
      return await this.servicioRepository.find();
    } catch (error) {
      throw new InternalServerErrorException(
        `Ocurrió un error al obtener los servicios: ${error.message}`,
      );
    }
  }

  // Obtener un servicio por ID
  async findOne(id: number): Promise<Servicio> {
    if (isNaN(id)) {
      throw new BadRequestException('El ID debe ser un número válido.');
    }

    const servicio = await this.servicioRepository.findOne({ where: { id } });
    if (!servicio) {
      throw new NotFoundException(`Servicio con ID ${id} no encontrado.`);
    }

    return servicio;
  }

  // Actualizar un servicio
  async update(id: number, updateServicioDto: UpdateServicioDto): Promise<Servicio> {
    const { codigo } = updateServicioDto;

    // Verificar si el ID es válido
    if (isNaN(id)) {
      throw new BadRequestException('El ID debe ser un número válido.');
    }

    // Verificar si el código proporcionado ya está en uso por otro servicio
    if (codigo) {
      const existingServicio = await this.servicioRepository.findOne({
        where: { codigo },
      });

      if (existingServicio && existingServicio.id !== id) {
        throw new BadRequestException(`El código ${codigo} ya está registrado en otro servicio.`);
      }
    }

    const servicio = await this.servicioRepository.preload({
      id,
      ...updateServicioDto,
    });
    if (!servicio) {
      throw new NotFoundException(`Servicio con ID ${id} no encontrado.`);
    }

    try {
      return await this.servicioRepository.save(servicio);
    } catch (error) {
      throw new InternalServerErrorException(
        `Ocurrió un error al intentar actualizar el servicio: ${error.message}`,
      );
    }
  }

  // Eliminar un servicio
  async remove(id: number): Promise<{ message: string }> {
    if (isNaN(id)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }

    const servicio = await this.servicioRepository.findOne({ where: { id } });
    if (!servicio) {
      throw new NotFoundException(`Servicio con ID ${id} no encontrado.`);
    }

    try {
      await this.servicioRepository.remove(servicio);
      return { message: `Servicio con ID ${id} eliminado con éxito.` };
    } catch (error) {
      throw new InternalServerErrorException(
        `Ocurrió un error al intentar eliminar el servicio: ${error.message}`,
      );
    }
  }
}
