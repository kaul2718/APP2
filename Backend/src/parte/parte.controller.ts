import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { ParteService } from './parte.service';
import { CreateParteDto } from './dto/create-parte.dto';
import { UpdateParteDto } from './dto/update-parte.dto';
import { Auth } from '../auth/decorators/auth.decorator';

import { Parte } from './entities/parte.entity';

@Auth('admin', 'tech', 'recep') // Ajusta los roles según necesites
@Controller('partes')
export class ParteController {
  constructor(private readonly parteService: ParteService) { }

  @Post()
  create(@Body() dto: CreateParteDto): Promise<Parte> {
    return this.parteService.create(dto);
  }

  @Get()
  findAllFlat(
    @Query('includeInactive') includeInactive?: boolean,
  ): Promise<Parte[]> {
    return this.parteService.findAll(includeInactive);
  }

  @Get('all')
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: any = 10,
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: any,
  ) {
    const isIncludeInactive = includeInactive === 'true' || includeInactive === true;
    const limitNum = Number(limit) || 10;
    const pageNum = Number(page) || 1;

    const result = await this.parteService.findAllPaginated(
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
    @Query('includeInactive') includeInactive?: boolean,
  ): Promise<Parte> {
    return this.parteService.findOne(id, includeInactive);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateParteDto,
  ): Promise<Parte> {
    return this.parteService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<Parte> {
    await this.parteService.remove(id);
    return this.parteService.findOne(id, true); // devuelve el soft deleted
  }

  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number): Promise<Parte> {
    await this.parteService.restore(id);
    return this.parteService.findOne(id); // devuelve restaurado
  }

  @Patch(':id/estado')
  async cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: boolean,
  ): Promise<Parte> {
    return this.parteService.update(id, { estado });
  }

  @Patch(':id/toggle-estado')
  async toggleEstado(@Param('id', ParseIntPipe) id: number): Promise<Parte> {
    return this.parteService.toggleStatus(id);
  }
}