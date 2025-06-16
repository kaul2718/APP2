import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateActividadTecnicaDto } from './dto/create-actividad-tecnica.dto';
import { UpdateActividadTecnicaDto } from './dto/update-actividad-tecnica.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from 'src/orders/entities/order.entity';
import { ActividadTecnica } from './entities/actividad-tecnica.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ActividadTecnicaService {
  constructor(
    @InjectRepository(ActividadTecnica)
    private readonly actividadTecnicaRepository: Repository<ActividadTecnica>,
    @InjectRepository(Order)
    private readonly ordenServicioRepository: Repository<Order>,
  ) { }

  /**
   * Agregar una actividad técnica a una orden existente
   */
  async create(workOrderNumber: string, createActividadDto: CreateActividadTecnicaDto): Promise<ActividadTecnica> {
    // Buscar la orden por su número de trabajo
    const orden = await this.ordenServicioRepository.findOne({ where: { workOrderNumber } });

    if (!orden) {
      throw new NotFoundException(`Orden de servicio con número ${workOrderNumber} no encontrada.`);
    }

    // Validación de datos
    if (!createActividadDto.descripcion || !createActividadDto.diagnostico || !createActividadDto.trabajoRealizado) {
      throw new BadRequestException('Los campos descripción, diagnóstico y trabajo realizado son requeridos.');
    }

    // Crear la nueva actividad técnica
    const actividad = this.actividadTecnicaRepository.create({
      ...createActividadDto,
      orden,
    });

    try {
      // Guardar la nueva actividad
      return await this.actividadTecnicaRepository.save(actividad);
    } catch (error) {
      throw new BadRequestException('Error al guardar la actividad técnica.', error.message);
    }
  }

  /**
   * Obtener todas las actividades técnicas de una orden específica
   */
  async findByOrder(workOrderNumber: string): Promise<ActividadTecnica[]> {
    const orden = await this.ordenServicioRepository.findOne({
      where: { workOrderNumber },
      relations: ['actividades'],
    });

    if (!orden) {
      throw new NotFoundException(`Orden de servicio con número ${workOrderNumber} no encontrada.`);
    }

    return orden.actividades;
  }

  /**
   * Actualizar una actividad técnica
   */
  async update(workOrderNumber: string, actividadId: number, updateActividadDto: UpdateActividadTecnicaDto): Promise<ActividadTecnica> {
    // Validación de los parámetros para asegurarse de que sean números válidos
    if (isNaN(actividadId)) {
      throw new BadRequestException(`El ID de la actividad (${actividadId}) no es un número válido.`);
    }

    // Buscar la actividad técnica con las relaciones necesarias
    const actividad = await this.actividadTecnicaRepository.findOne({
      where: { id: actividadId },
      relations: ['orden'], // Relación con la orden
    });

    if (!actividad) {
      throw new NotFoundException('Actividad técnica no encontrada.');
    }

    // Verificar que la actividad pertenece a la orden correcta
    if (actividad.orden.workOrderNumber !== workOrderNumber) {
      throw new NotFoundException('La actividad técnica no pertenece a esta orden de trabajo.');
    }

    // Validar campos antes de la actualización (por ejemplo, que los valores sean correctos)
    if (updateActividadDto.descripcion && updateActividadDto.descripcion.length < 5) {
      throw new BadRequestException('La descripción debe tener al menos 5 caracteres.');
    }

    // Actualizar los campos de la actividad técnica
    Object.assign(actividad, updateActividadDto);

    try {
      // Guardar la actividad técnica actualizada
      const savedActividad = await this.actividadTecnicaRepository.save(actividad);

      // Recargar la actividad con las relaciones necesarias y devolverla
      return this.actividadTecnicaRepository.findOne({
        where: { id: savedActividad.id },
        relations: ['orden'], // Incluir las relaciones que necesitas
      });
    } catch (error) {
      throw new BadRequestException('Error al actualizar la actividad técnica.', error.message);
    }
  }

  /**
   * Eliminar una actividad técnica específica de una orden
   */
  async remove(workOrderNumber: string, actividadId: number): Promise<void> {
    // Verificar si la orden existe
    const orden = await this.ordenServicioRepository.findOne({
      where: { workOrderNumber },
      relations: ['actividades'],
    });

    if (!orden) {
      throw new NotFoundException(`Orden de servicio con número ${workOrderNumber} no encontrada.`);
    }

    // Verificar si la actividad pertenece a la orden
    const actividad = await this.actividadTecnicaRepository.findOne({ where: { id: actividadId, orden: { id: orden.id } } });

    if (!actividad) {
      throw new NotFoundException(`Actividad técnica con ID ${actividadId} no encontrada en la orden ${workOrderNumber}.`);
    }

    try {
      // Eliminar la actividad técnica
      await this.actividadTecnicaRepository.remove(actividad);
    } catch (error) {
      throw new BadRequestException('Error al eliminar la actividad técnica.', error.message);
    }
  }
}