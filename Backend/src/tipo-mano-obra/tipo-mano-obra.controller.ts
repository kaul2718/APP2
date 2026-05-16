import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query
} from '@nestjs/common';
import { TipoManoObraService } from './tipo-mano-obra.service';
import { CreateTipoManoObraDto } from './dto/create-tipo-mano-obra.dto';
import { UpdateTipoManoObraDto } from './dto/update-tipo-mano-obra.dto';
import { Auth } from '../auth/decorators/auth.decorator';

import { TipoManoObra } from './entities/tipo-mano-obra.entity';

@Auth('admin', 'tech', 'recep') // Ajusta los roles según necesites
@Controller('tipos-mano-obra')
export class TipoManoObraController {
  constructor(private readonly tipoManoObraService: TipoManoObraService) { }

  @Post()
  create(@Body() dto: CreateTipoManoObraDto): Promise<TipoManoObra> {
    return this.tipoManoObraService.create(dto);
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

    const result = await this.tipoManoObraService.findAllPaginated(
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

  @Get()
  findAllSimple(@Query('includeInactive') includeInactive?: boolean): Promise<TipoManoObra[]> {
    return this.tipoManoObraService.findAll(includeInactive);
  }

  @Get('codigo/:codigo')
  findByCodigo(@Param('codigo') codigo: string): Promise<TipoManoObra> {
    return this.tipoManoObraService.findByCodigo(codigo);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeInactive') includeInactive?: boolean,
  ): Promise<TipoManoObra> {
    return this.tipoManoObraService.findOne(id, includeInactive);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTipoManoObraDto,
  ): Promise<TipoManoObra> {
    return this.tipoManoObraService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<TipoManoObra> {
    await this.tipoManoObraService.remove(id);
    return this.tipoManoObraService.findOne(id, true); // Devuelve el registro con soft delete
  }

  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number): Promise<TipoManoObra> {
    await this.tipoManoObraService.restore(id);
    return this.tipoManoObraService.findOne(id); // Devuelve el registro restaurado
  }

  @Patch(':id/estado')
  async cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: boolean,
  ): Promise<TipoManoObra> {
    return this.tipoManoObraService.update(id, { estado });
  }

  @Patch(':id/toggle-estado')
  async toggleEstado(@Param('id', ParseIntPipe) id: number): Promise<TipoManoObra> {
    return this.tipoManoObraService.toggleStatus(id);
  }
}