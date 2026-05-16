import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { CategoriaService } from './categoria.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { Auth } from '../auth/decorators/auth.decorator';

import { Categoria } from './entities/categoria.entity';

@Auth('admin', 'tech', 'recep') // Ajusta los roles según necesites
@Controller('categorias')
export class CategoriaController {
  constructor(private readonly categoriaService: CategoriaService) { }

  @Post()
  create(@Body() dto: CreateCategoriaDto): Promise<Categoria> {
    return this.categoriaService.create(dto);
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

    const result = await this.categoriaService.findAllPaginated(
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
  ): Promise<Categoria> {
    return this.categoriaService.findOne(id, includeInactive);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoriaDto,
  ): Promise<Categoria> {
    return this.categoriaService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<Categoria> {
    await this.categoriaService.remove(id);
    return this.categoriaService.findOne(id, true); // devuelve el soft deleted
  }

  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number): Promise<Categoria> {
    await this.categoriaService.restore(id);
    return this.categoriaService.findOne(id); // devuelve restaurado
  }

  @Patch(':id/estado')
  async cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: boolean,
  ): Promise<Categoria> {
    return this.categoriaService.update(id, { estado });
  }

  @Patch(':id/toggle-estado')
  async toggleEstado(@Param('id', ParseIntPipe) id: number): Promise<Categoria> {
    return this.categoriaService.toggleStatus(id);
  }
}