import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { ActividadTecnicaService } from './actividad-tecnica.service';
import { CreateActividadTecnicaDto } from './dto/create-actividad-tecnica.dto';
import { UpdateActividadTecnicaDto } from './dto/update-actividad-tecnica.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { Role } from '../common/enums/rol.enum';
import { ActividadTecnica } from './entities/actividad-tecnica.entity';

@Auth(Role.ADMIN, Role.TECH) // Ajusta los roles según necesites
@Controller('actividades-tecnicas')
export class ActividadTecnicaController {
  constructor(private readonly actividadService: ActividadTecnicaService) { }

  @Post()
  create(@Body() dto: CreateActividadTecnicaDto): Promise<ActividadTecnica> {
    return this.actividadService.create(dto);
  }

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

  @Get('por-orden/:ordenId')
  findByOrdenId(
    @Param('ordenId', ParseIntPipe) ordenId: number,
  ): Promise<ActividadTecnica[]> {
    return this.actividadService.findByOrdenId(ordenId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ActividadTecnica> {
    return this.actividadService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateActividadTecnicaDto,
  ): Promise<ActividadTecnica> {
    return this.actividadService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.actividadService.remove(id);
  }

  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.actividadService.restore(id);
  }

  @Patch(':id/toggle-estado')
  async toggleEstado(@Param('id', ParseIntPipe) id: number): Promise<ActividadTecnica> {
    return this.actividadService.toggleStatus(id);
  }
}