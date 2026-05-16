import * as fs from 'fs';
import {Controller,Post,Body,Get,Param,Patch,Delete,Query,ParseIntPipe,DefaultValuePipe,} from '@nestjs/common';
import { MarcaService } from './marca.service';
import { CreateMarcaDto } from './dto/create-marca.dto';
import { UpdateMarcaDto } from './dto/update-marca.dto';
import { Marca } from './entities/marca.entity';
import { Auth } from '../auth/decorators/auth.decorator';


@Auth('admin', 'tech', 'recep') // Ajusta los roles según necesites
@Controller('marcas')
export class MarcaController {
  constructor(private readonly marcaService: MarcaService) {}

  @Post()
  create(@Body() dto: CreateMarcaDto): Promise<Marca> {
    return this.marcaService.create(dto);
  }

  @Get('all')
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const isIncludeInactive = includeInactive === 'true';
    const limitNum = Number(limit) || 10;
    const pageNum = Number(page) || 1;

    try {
      fs.appendFileSync('debug.txt', `[${new Date().toISOString()}] CONTROLLER: page=${page} (pageNum=${pageNum}), limit=${limit} (limitNum=${limitNum})\n`);
    } catch (e) {
      console.error('Error writing to debug.txt', e);
    }

    const result = await this.marcaService.findAllPaginated(
      pageNum,
      limitNum,
      search,
      isIncludeInactive,
    );

    return {
      debug: { page: pageNum, limit: limitNum, limitType: typeof limitNum },
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
  ): Promise<Marca> {
    return this.marcaService.findOne(id, includeDeleted);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMarcaDto,
  ): Promise<Marca> {
    return this.marcaService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<Marca> {
    await this.marcaService.remove(id);
    return this.marcaService.findOne(id, true); // devuelve el soft deleted
  }

  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number): Promise<Marca> {
    await this.marcaService.restore(id);
    return this.marcaService.findOne(id); // devuelve restaurado
  }

  @Patch(':id/estado')
  async cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: boolean,
  ): Promise<Marca> {
    return this.marcaService.actualizarEstado(id, estado);
  }

  @Patch(':id/toggle-estado')
  async toggleEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: boolean,
  ): Promise<Marca> {
    return this.marcaService.actualizarEstado(id, estado);
  }
}