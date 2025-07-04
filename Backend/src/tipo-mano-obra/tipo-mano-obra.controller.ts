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
import { Role } from '../common/enums/rol.enum';
import { TipoManoObra } from './entities/tipo-mano-obra.entity';

@Auth(Role.ADMIN)
@Controller('tipos-mano-obra')
export class TipoManoObraController {
  constructor(private readonly tipoManoObraService: TipoManoObraService) { }

  @Post()
  create(@Body() dto: CreateTipoManoObraDto): Promise<TipoManoObra> {
    return this.tipoManoObraService.create(dto);
  }

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    const result = await this.tipoManoObraService.findAllPaginated(
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

  @Get('all')
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