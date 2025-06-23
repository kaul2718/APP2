import { Controller, Get, Post, Body, Patch, Param, Delete, InternalServerErrorException, BadRequestException, NotFoundException } from '@nestjs/common';
import { TipoActividadTecnicaService } from './tipo-actividad-tecnica.service';
import { CreateTipoActividadTecnicaDto } from './dto/create-tipo-actividad-tecnica.dto';
import { UpdateTipoActividadTecnicaDto } from './dto/update-tipo-actividad-tecnica.dto';
import { TipoActividadTecnica } from './entities/tipo-actividad-tecnica.entity';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';

@Auth(Role.ADMIN)
@Controller('tipo-actividad-tecnica')
export class TipoActividadTecnicaController {
  constructor(private readonly tipoActividadService: TipoActividadTecnicaService) {}

  @Auth(Role.TECH)
  @Post()
  async create(
    @Body() createDto: CreateTipoActividadTecnicaDto,
  ): Promise<TipoActividadTecnica> {
    if (!createDto.nombre || !createDto.descripcion) {
      throw new BadRequestException('Nombre y descripción son obligatorios.');
    }
    try {
      return await this.tipoActividadService.create(createDto);
    } catch (error) {
      throw new InternalServerErrorException('Error creando tipo de actividad técnica.');
    }
  }

  @Auth(Role.TECH)
  @Get()
  async findAll(): Promise<TipoActividadTecnica[]> {
    try {
      return await this.tipoActividadService.findAll();
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener tipos de actividad técnica.');
    }
  }

  @Auth(Role.TECH)
  @Get(':id')
  async findOne(@Param('id') id: number): Promise<TipoActividadTecnica> {
    if (isNaN(id)) {
      throw new BadRequestException('ID inválido.');
    }
    const tipo = await this.tipoActividadService.findOne(id);
    if (!tipo) {
      throw new NotFoundException(`TipoActividadTecnica con ID ${id} no encontrado.`);
    }
    return tipo;
  }

  @Auth(Role.TECH)
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updateDto: UpdateTipoActividadTecnicaDto,
  ): Promise<TipoActividadTecnica> {
    if (isNaN(id)) {
      throw new BadRequestException('ID inválido.');
    }
    try {
      return await this.tipoActividadService.update(id, updateDto);
    } catch (error) {
      throw new InternalServerErrorException('Error actualizando tipo de actividad técnica.');
    }
  }

  @Auth(Role.TECH)
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<{ message: string }> {
    if (isNaN(id)) {
      throw new BadRequestException('ID inválido.');
    }
    try {
      return await this.tipoActividadService.remove(id);
    } catch (error) {
      throw new InternalServerErrorException('Error eliminando tipo de actividad técnica.');
    }
  }
}