import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { DetalleRepuestosService } from './detalle-repuestos.service';
import { CreateDetalleRepuestoDto } from './dto/create-detalle-repuesto.dto';
import { UpdateDetalleRepuestoDto } from './dto/update-detalle-repuesto.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { Role } from '../common/enums/rol.enum';
import { DetalleRepuestos } from './entities/detalle-repuesto.entity';

@Auth(Role.ADMIN)
@Controller('detalles-repuestos')
export class DetalleRepuestosController {
  constructor(private readonly detalleService: DetalleRepuestosService) { }

  @Post()
  create(@Body() dto: CreateDetalleRepuestoDto): Promise<DetalleRepuestos> {
    return this.detalleService.create(dto);
  }

  @Get('all')
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    const result = await this.detalleService.findAllPaginated(
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

  @Get('by-presupuesto/:presupuestoId')
  async findByPresupuesto(
    @Param('presupuestoId', ParseIntPipe) presupuestoId: number,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    const detalles = await this.detalleService.findAll(includeInactive);
    return detalles.filter(d => d.presupuestoId === presupuestoId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeInactive') includeInactive?: boolean,
  ): Promise<DetalleRepuestos> {
    return this.detalleService.findOne(id, includeInactive);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDetalleRepuestoDto,
  ): Promise<DetalleRepuestos> {
    const detalleActualizado = await this.detalleService.update(id, dto);
    // Forzar la carga de relaciones si no vinieron en la respuesta
    if (!detalleActualizado.repuesto) {
      return await this.detalleService.findOne(id, true);
    }
    return detalleActualizado;
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<DetalleRepuestos> {
    await this.detalleService.remove(id);
    return this.detalleService.findOne(id, true); // devuelve el soft deleted
  }

  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number): Promise<DetalleRepuestos> {
    await this.detalleService.restore(id);
    return this.detalleService.findOne(id); // devuelve restaurado
  }

  @Patch(':id/estado')
  async cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: boolean,
  ): Promise<DetalleRepuestos> {
    return this.detalleService.update(id, { estado });
  }

  @Patch(':id/toggle-estado')
  async toggleEstado(@Param('id', ParseIntPipe) id: number): Promise<DetalleRepuestos> {
    return this.detalleService.toggleStatus(id);
  }

  @Get('by-presupuesto/:presupuestoId/total')
  async calcularTotalRepuestos(
    @Param('presupuestoId', ParseIntPipe) presupuestoId: number,
  ) {
    const detalles = await this.detalleService.findAll(true);
    const detallesPresupuesto = detalles.filter(d =>
      d.presupuestoId === presupuestoId && d.estado && !d.deletedAt
    );

    const total = detallesPresupuesto.reduce((sum, detalle) => sum + detalle.subtotal, 0);

    return {
      totalRepuestos: total,
      cantidadItems: detallesPresupuesto.length,
      detalles: detallesPresupuesto
    };
  }

}