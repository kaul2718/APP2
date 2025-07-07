import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { EstadoOrdenService } from './estado-orden.service';
import { CreateEstadoOrdenDto } from './dto/create-estado-orden.dto';
import { UpdateEstadoOrdenDto } from './dto/update-estado-orden.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { Role } from '../common/enums/rol.enum';
import { EstadoOrden } from './entities/estado-orden.entity';

@Auth(Role.ADMIN)
@Controller('estados-orden')
export class EstadoOrdenController {
  constructor(private readonly estadoOrdenService: EstadoOrdenService) { }

  @Post()
  create(@Body() dto: CreateEstadoOrdenDto): Promise<EstadoOrden> {
    return this.estadoOrdenService.create(dto);
  }

  @Get('all')
  async findAllPaginated(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    const result = await this.estadoOrdenService.findAllPaginated(
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

  @Get()
  findAll(@Query('includeInactive') includeInactive?: boolean): Promise<EstadoOrden[]> {
    return this.estadoOrdenService.findAll(includeInactive);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeInactive') includeInactive?: boolean,
  ): Promise<EstadoOrden> {
    return this.estadoOrdenService.findOne(id, includeInactive);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEstadoOrdenDto,
  ): Promise<EstadoOrden> {
    return this.estadoOrdenService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<EstadoOrden> {
    await this.estadoOrdenService.remove(id);
    return this.estadoOrdenService.findOne(id, true);
  }

  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number): Promise<EstadoOrden> {
    await this.estadoOrdenService.restore(id);
    return this.estadoOrdenService.findOne(id);
  }

  @Patch(':id/estado')
  async cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: boolean,
  ): Promise<EstadoOrden> {
    return this.estadoOrdenService.update(id, { estado });
  }

  @Patch(':id/toggle-estado')
  async toggleEstado(@Param('id', ParseIntPipe) id: number): Promise<EstadoOrden> {
    return this.estadoOrdenService.toggleStatus(id);
  }

  @Get('nombre/:nombre')
  findByName(@Param('nombre') nombre: string): Promise<EstadoOrden> {
    return this.estadoOrdenService.findByName(nombre);
  }
}