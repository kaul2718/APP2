import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { ActividadTecnicaService } from './actividad-tecnica.service';
import { CreateActividadTecnicaDto } from './dto/create-actividad-tecnica.dto';
import { UpdateActividadTecnicaDto } from './dto/update-actividad-tecnica.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { ActividadTecnica } from './entities/actividad-tecnica.entity';

@Controller('actividades-tecnicas')
export class ActividadTecnicaController {
  constructor(private readonly actividadService: ActividadTecnicaService) { }

  @Auth('admin', 'tech', 'recep')
  @Post()
  create(@Body() dto: CreateActividadTecnicaDto): Promise<ActividadTecnica> {
    return this.actividadService.create(dto);
  }

  @Auth('admin', 'tech', 'recep')
  @Get('all')
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    const result = await this.actividadService.findAllPaginated(
      page,
      limit,
      search,
      includeInactive,
    );

    return {
      items: result.data,
      totalItems: result.total,
      totalPages: Math.ceil(result.total / limit),
      currentPage: page,
    };
  }

  @Auth('admin', 'tech', 'recep') // Ajusta los roles según necesites
  @Get('por-orden/:ordenId')
  findByOrdenId(
    @Param('ordenId', ParseIntPipe) ordenId: number,
  ): Promise<ActividadTecnica[]> {
    return this.actividadService.findByOrdenId(ordenId);
  }

  @Auth('admin', 'tech', 'recep') // Ajusta los roles según necesites
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ActividadTecnica> {
    return this.actividadService.findOne(id);
  }

  @Auth('admin', 'tech', 'recep') // Ajusta los roles según necesites
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateActividadTecnicaDto,
  ): Promise<ActividadTecnica> {
    return this.actividadService.update(id, dto);
  }

  @Auth('admin', 'tech', 'recep') // Ajusta los roles según necesites
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.actividadService.remove(id);
  }

  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.actividadService.restore(id);
  }

  @Auth('admin', 'tech', 'recep') // Ajusta los roles según necesites
  @Patch(':id/toggle-estado')
  async toggleEstado(@Param('id', ParseIntPipe) id: number): Promise<ActividadTecnica> {
    return this.actividadService.toggleStatus(id);
  }
}