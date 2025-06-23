import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActividadTecnica } from './entities/actividad-tecnica.entity';
import { CreateActividadTecnicaDto } from './dto/create-actividad-tecnica.dto';
import { UpdateActividadTecnicaDto } from './dto/update-actividad-tecnica.dto';

@Injectable()
export class ActividadTecnicaService {
  constructor(
    @InjectRepository(ActividadTecnica)
    private readonly actividadRepository: Repository<ActividadTecnica>,
  ) { }

  async create(createDto: CreateActividadTecnicaDto): Promise<ActividadTecnica> {
    const actividad = this.actividadRepository.create({
      ordenId: createDto.ordenId,
      tipoActividadId: createDto.tipoActividadId,
      diagnostico: createDto.diagnostico,
      trabajoRealizado: createDto.trabajoRealizado,
      fecha: new Date(),  // Asignas la fecha actual aquí
    });
    try {
      return await this.actividadRepository.save(actividad);
    } catch (error) {
      throw new InternalServerErrorException(`Error creando actividad técnica: ${error.message}`);
    }
  }

  async findAll(): Promise<ActividadTecnica[]> {
    return this.actividadRepository.find({
      where: { isDeleted: false },
      relations: ['orden', 'tipoActividad'],
    });
  }

  async findOne(id: number): Promise<ActividadTecnica> {
    const actividad = await this.actividadRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['orden', 'tipoActividad'],
    });
    if (!actividad) throw new NotFoundException(`Actividad técnica con ID ${id} no encontrada.`);
    return actividad;
  }

  async update(id: number, updateDto: UpdateActividadTecnicaDto): Promise<ActividadTecnica> {
    const actividad = await this.findOne(id);

    // Asignar campos simples
    actividad.diagnostico = updateDto.diagnostico ?? actividad.diagnostico;
    actividad.trabajoRealizado = updateDto.trabajoRealizado ?? actividad.trabajoRealizado;

    // Asignar relaciones explícitamente si vienen en el DTO
    if (updateDto.tipoActividadId) {
      actividad.tipoActividad = { id: updateDto.tipoActividadId } as any; // solo referencia mínima para la relación
      actividad.tipoActividadId = updateDto.tipoActividadId; // si tienes esta columna explícita
    }

    if (updateDto.ordenId) {
      actividad.orden = { id: updateDto.ordenId } as any;
      actividad.ordenId = updateDto.ordenId;
    }

    try {
      return await this.actividadRepository.save(actividad);
    } catch (error) {
      throw new InternalServerErrorException(`Error actualizando actividad técnica: ${error.message}`);
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    const actividad = await this.findOne(id);
    actividad.isDeleted = true;
    actividad.deletedAt = new Date();
    await this.actividadRepository.save(actividad);
    return { message: `Actividad técnica con ID ${id} eliminada (soft delete).` };
  }
}
