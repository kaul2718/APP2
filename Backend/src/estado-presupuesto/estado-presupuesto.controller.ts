import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { EstadoPresupuestoService } from './estado-presupuesto.service';
import { CreateEstadoPresupuestoDto } from './dto/create-estado-presupuesto.dto';
import { UpdateEstadoPresupuestoDto } from './dto/update-estado-presupuesto.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { Role } from '../common/enums/rol.enum';
import { EstadoPresupuesto } from './entities/estado-presupuesto.entity';

@Auth(Role.ADMIN)
@Controller('estados-presupuesto')
export class EstadoPresupuestoController {
  constructor(private readonly estadoPresupuestoService: EstadoPresupuestoService) {}

  @Post()
  create(@Body() dto: CreateEstadoPresupuestoDto): Promise<EstadoPresupuesto> {
    return this.estadoPresupuestoService.create(dto);
  }

  @Get('all')
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    const result = await this.estadoPresupuestoService.findAllPaginated(
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

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeInactive') includeInactive?: boolean,
  ): Promise<EstadoPresupuesto> {
    return this.estadoPresupuestoService.findOne(id, includeInactive);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEstadoPresupuestoDto,
  ): Promise<EstadoPresupuesto> {
    return this.estadoPresupuestoService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<EstadoPresupuesto> {
    await this.estadoPresupuestoService.remove(id);
    return this.estadoPresupuestoService.findOne(id, true); // devuelve el soft deleted
  }

  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number): Promise<EstadoPresupuesto> {
    await this.estadoPresupuestoService.restore(id);
    return this.estadoPresupuestoService.findOne(id); // devuelve restaurado
  }

  @Patch(':id/estado')
  async cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: boolean,
  ): Promise<EstadoPresupuesto> {
    return this.estadoPresupuestoService.update(id, { estado });
  }

  @Patch(':id/toggle-estado')
  async toggleEstado(@Param('id', ParseIntPipe) id: number): Promise<EstadoPresupuesto> {
    return this.estadoPresupuestoService.toggleStatus(id);
  }
}