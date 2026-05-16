import { Controller, Post, Body, Get, Param, Patch, Delete, Query, ParseIntPipe, } from '@nestjs/common';
import { TipoEquipoService } from './tipo-equipo.service';
import { CreateTipoEquipoDto } from './dto/create-tipo-equipo.dto';
import { UpdateTipoEquipoDto } from './dto/update-tipo-equipo.dto';
import { TipoEquipo } from './entities/tipo-equipo.entity';
import { Auth } from 'src/auth/decorators/auth.decorator';


@Auth('admin', 'tech', 'recep') // Ajusta los roles según necesites
@Controller('tipos-equipo')
export class TipoEquipoController {
  constructor(private readonly tipoEquipoService: TipoEquipoService) { }

  @Post()
  create(@Body() dto: CreateTipoEquipoDto): Promise<TipoEquipo> {
    return this.tipoEquipoService.create(dto);
  }

  @Get('all')
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: any = 10,
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const isIncludeInactive = includeInactive === 'true';
    const limitNum = Number(limit) || 10;
    const pageNum = Number(page) || 1;

    const result = await this.tipoEquipoService.findAllPaginated(
      pageNum,
      limitNum,
      search,
      isIncludeInactive,
    );

    return {
      items: result.data,
      totalItems: result.total,
      totalPages: Math.ceil(result.total / limitNum),
      currentPage: pageNum,
    };
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeDeleted') includeDeleted?: boolean,
  ): Promise<TipoEquipo> {
    return this.tipoEquipoService.findOne(id, includeDeleted);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTipoEquipoDto,
  ): Promise<TipoEquipo> {
    return this.tipoEquipoService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<TipoEquipo> {
    await this.tipoEquipoService.remove(id);
    return this.tipoEquipoService.findOne(id, true); // devuelve el soft deleted
  }

  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number): Promise<TipoEquipo> {
    await this.tipoEquipoService.restore(id);
    return this.tipoEquipoService.findOne(id); // devuelve restaurado
  }

  @Patch(':id/estado')
  async cambiarEstado(
    @Param('id') id: number,
    @Body('estado') estado: boolean,
  ) {
    return this.tipoEquipoService.actualizarEstado(id, estado);
  }
  @Patch(':id/toggle-estado')
  async toggleEstado(
    @Param('id') id: number,
    @Body('estado') estado: boolean,
  ) {
    // Aquí llamas al servicio para actualizar el estado
    return this.tipoEquipoService.actualizarEstado(id, estado);
  }
}
