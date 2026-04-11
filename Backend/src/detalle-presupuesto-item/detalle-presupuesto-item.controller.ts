import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { DetallePresupuestoItemService } from './detalle-presupuesto-item.service';
import { CreateDetallePresupuestoItemDto } from './dto/create-detalle-presupuesto-item.dto';
import { UpdateDetallePresupuestoItemDto } from './dto/update-detalle-presupuesto-item.dto';
import { Auth } from '../auth/decorators/auth.decorator';

import { DetallePresupuestoItem } from './entities/detalle-presupuesto-item.entity';

@Auth('admin', 'tech', 'recep') // Ajusta los roles según necesites
@Controller('detalles-presupuesto-item')
export class DetallePresupuestoItemController {
  constructor(private readonly detalleService: DetallePresupuestoItemService) { }

  @Post()
  create(@Body() dto: CreateDetallePresupuestoItemDto): Promise<DetallePresupuestoItem> {
    return this.detalleService.create(dto);
  }

  @Auth('admin', 'tech', 'recep', 'client')
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

  @Auth('admin', 'tech', 'recep', 'client')
  @Get('by-presupuesto/:presupuestoId')
  async findByPresupuesto(
    @Param('presupuestoId', ParseIntPipe) presupuestoId: number,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    return this.detalleService.findByPresupuesto(presupuestoId, includeInactive);
  }

  @Auth('admin', 'tech', 'recep', 'client')
  @Get('by-orden/:orderId')
  async findByOrder(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    return this.detalleService.findByOrder(orderId, includeInactive);
  }

  @Auth('admin', 'tech', 'recep', 'client')
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeInactive') includeInactive?: boolean,
  ): Promise<DetallePresupuestoItem> {
    return this.detalleService.findOne(id, includeInactive);
  }
  @Auth('admin', 'tech', 'recep', 'client')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDetallePresupuestoItemDto,
  ): Promise<DetallePresupuestoItem> {
    return this.detalleService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<DetallePresupuestoItem> {
    await this.detalleService.remove(id);
    return this.detalleService.findOne(id, true); // devuelve el soft deleted
  }

  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number): Promise<DetallePresupuestoItem> {
    await this.detalleService.restore(id);
    return this.detalleService.findOne(id); // devuelve restaurado
  }
  @Auth('admin', 'tech', 'recep', 'client')
  @Patch(':id/estado')
  async cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: boolean,
  ): Promise<DetallePresupuestoItem> {
    return this.detalleService.update(id, { estado });
  }
  @Auth('admin', 'tech', 'recep', 'client')
  @Patch(':id/toggle-estado')
  async toggleEstado(@Param('id', ParseIntPipe) id: number): Promise<DetallePresupuestoItem> {
    return this.detalleService.toggleStatus(id);
  }
  
  @Auth('admin', 'tech', 'recep', 'client')
  @Get('by-presupuesto/:presupuestoId/total')
  async calcularTotalItems(
    @Param('presupuestoId', ParseIntPipe) presupuestoId: number,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    return this.detalleService.getTotalByPresupuesto(presupuestoId, includeInactive);
  }

  @Auth('admin', 'tech', 'recep', 'client')
  @Get('by-orden/:orderId/total')
  async calcularTotalItemsPorOrden(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    return this.detalleService.getTotalByOrder(orderId, includeInactive);
  }

}