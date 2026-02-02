import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { TipoActividadTecnicaService } from './tipo-actividad-tecnica.service';
import { CreateTipoActividadTecnicaDto } from './dto/create-tipo-actividad-tecnica.dto';
import { UpdateTipoActividadTecnicaDto } from './dto/update-tipo-actividad-tecnica.dto';
import { Auth } from '../auth/decorators/auth.decorator';

import { TipoActividadTecnica } from './entities/tipo-actividad-tecnica.entity';

@Auth('admin', 'tech', 'recep') // Ajusta los roles según necesites
@Controller('tipos-actividad-tecnica')
export class TipoActividadTecnicaController {
  constructor(
    private readonly tipoActividadService: TipoActividadTecnicaService
  ) { }

  @Post()
  create(@Body() dto: CreateTipoActividadTecnicaDto): Promise<TipoActividadTecnica> {
    return this.tipoActividadService.create(dto);
  }
  @Auth('admin', 'tech', 'recep', 'client') // Ajusta los roles según necesites

  @Get('all')
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    const result = await this.tipoActividadService.findAllPaginated(
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

  @Auth('admin', 'tech', 'recep', 'client') // Ajusta los roles según necesites

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeInactive') includeInactive?: boolean,
  ): Promise<TipoActividadTecnica> {
    return this.tipoActividadService.findOne(id, includeInactive);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTipoActividadTecnicaDto,
  ): Promise<TipoActividadTecnica> {
    return this.tipoActividadService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.tipoActividadService.remove(id);
  }

  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.tipoActividadService.restore(id);
  }

  @Auth('admin', 'tech', 'recep', 'client') // Ajusta los roles según necesites
  @Patch(':id/estado')
  async cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: boolean,
  ): Promise<TipoActividadTecnica> {
    return this.tipoActividadService.update(id, { estado });
  }

  @Auth('admin', 'tech', 'recep', 'client') // Ajusta los roles según necesites
  @Patch(':id/toggle-estado')
  async toggleEstado(@Param('id', ParseIntPipe) id: number): Promise<TipoActividadTecnica> {
    return this.tipoActividadService.toggleStatus(id);
  }

  @Auth('admin', 'tech', 'recep', 'client') // Ajusta los roles según necesites
  @Get()
  async findAllSimple(@Query('includeInactive') includeInactive?: boolean): Promise<TipoActividadTecnica[]> {
    return this.tipoActividadService.findAll(includeInactive);
  }
}