import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { InventarioService } from './inventario.service';
import { CreateInventarioDto } from './dto/create-inventario.dto';
import { UpdateInventarioDto } from './dto/update-inventario.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { Role } from '../common/enums/rol.enum';
import { Inventario } from './entities/inventario.entity';

@Auth(Role.ADMIN)
@Controller('inventario')
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) { }

  @Post()
  create(@Body() dto: CreateInventarioDto): Promise<Inventario> {
    return this.inventarioService.create(dto);
  }

  @Get('all')
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    const result = await this.inventarioService.findAllPaginated(
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
  ): Promise<Inventario> {
    return this.inventarioService.findOne(id, includeInactive);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInventarioDto,
  ): Promise<Inventario> {
    return this.inventarioService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<Inventario> {
    await this.inventarioService.remove(id);
    return this.inventarioService.findOne(id, true); // devuelve el soft deleted
  }

  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number): Promise<Inventario> {
    await this.inventarioService.restore(id);
    return this.inventarioService.findOne(id); // devuelve restaurado
  }

  @Patch(':id/estado')
  async cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: boolean,
  ): Promise<Inventario> {
    return this.inventarioService.update(id, { estado });
  }

  @Patch(':id/toggle-estado')
  async toggleEstado(@Param('id', ParseIntPipe) id: number): Promise<Inventario> {
    return this.inventarioService.toggleStatus(id);
  }

  // Endpoints específicos para gestión de inventario
  @Get(':id/check-stock')
  async checkStock(@Param('id', ParseIntPipe) id: number) {
    return this.inventarioService.checkStock(id);
  }

  @Patch(':id/update-stock')
  async updateStock(
    @Param('id', ParseIntPipe) id: number,
    @Body('cantidad') cantidad: number,
    @Body('operacion') operacion: 'add' | 'subtract',
  ): Promise<Inventario> {
    return this.inventarioService.updateStock(id, cantidad, operacion);
  }

  @Get('bajo-stock')
  async findLowStock(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const result = await this.inventarioService.findLowStockPaginated(page, limit);

    return {
      items: result.data,
      totalItems: result.total,
      totalPages: Math.ceil(result.total / limit),
      currentPage: page,
    };
  }
}