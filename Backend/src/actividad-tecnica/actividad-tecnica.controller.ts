import { Controller, Get, Post, Body, Patch, Param, Delete, BadRequestException, ParseIntPipe } from '@nestjs/common';
import { ActividadTecnicaService } from './actividad-tecnica.service';
import { CreateActividadTecnicaDto } from './dto/create-actividad-tecnica.dto';
import { UpdateActividadTecnicaDto } from './dto/update-actividad-tecnica.dto';

@Controller('orders/:workOrderNumber/actividad-tecnica')
export class ActividadTecnicaController {
  constructor(private readonly actividadTecnicaService: ActividadTecnicaService) { }

  @Post()
  async create(
    @Param('workOrderNumber') workOrderNumber: string,
    @Body() createActividadDto: CreateActividadTecnicaDto,
  ) {
    // Aquí podrías validar workOrderNumber si es necesario
    if (!this.isValidWorkOrderNumber(workOrderNumber)) {
      throw new BadRequestException('Número de orden de trabajo no válido.');
    }

    return this.actividadTecnicaService.create(workOrderNumber, createActividadDto);
  }

  @Get()
  async findByOrder(@Param('workOrderNumber') workOrderNumber: string) {
    if (!this.isValidWorkOrderNumber(workOrderNumber)) {
      throw new BadRequestException('Número de orden de trabajo no válido.');
    }
    return this.actividadTecnicaService.findByOrder(workOrderNumber);
  }

  @Patch(':actividadId')
  async update(
    @Param('workOrderNumber') workOrderNumber: string,
    @Param('actividadId', ParseIntPipe) actividadId: number, // Usar ParseIntPipe para convertir a número
    @Body() updateActividadDto: UpdateActividadTecnicaDto,
  ) {
    if (!this.isValidWorkOrderNumber(workOrderNumber)) {
      throw new BadRequestException('Número de orden de trabajo no válido.');
    }

    return this.actividadTecnicaService.update(workOrderNumber, actividadId, updateActividadDto);
  }

  @Delete(':actividadId')
  async remove(
    @Param('workOrderNumber') workOrderNumber: string,
    @Param('actividadId', ParseIntPipe) actividadId: number, // Usar ParseIntPipe para convertir a número
  ) {
    if (!this.isValidWorkOrderNumber(workOrderNumber)) {
      throw new BadRequestException('Número de orden de trabajo no válido.');
    }
    return this.actividadTecnicaService.remove(workOrderNumber, actividadId);
  }

  private isValidWorkOrderNumber(workOrderNumber: string): boolean {
    // Valida el formato del workOrderNumber si es necesario
    return /^[A-Za-z0-9-]+$/.test(workOrderNumber); // Solo ejemplo, ajusta según el formato esperado
  }
}
