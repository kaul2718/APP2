import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { PresupuestoService } from './presupuesto.service';
import { CreatePresupuestoDto } from './dto/create-presupuesto.dto';
import { UpdatePresupuestoDto } from './dto/update-presupuesto.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';


@Auth('admin', 'tech', 'recep') // Ajusta los roles según necesites
@Controller('presupuestos')
export class PresupuestoController {
  constructor(private readonly presupuestoService: PresupuestoService) { }

  @Auth('admin', 'tech', 'recep') // Ajusta los roles según necesites
  @Post()
  create(@Body() dto: CreatePresupuestoDto) {
    return this.presupuestoService.create(dto);
  }

  @Get('all')
  async findAllPaginated(
    @Query('page') page: number = 1,
    @Query('limit') limit: any = 10,
    @Query('search') search?: string,
    @Query('includeDeleted') includeDeleted?: any,
  ) {
    const isIncludeDeleted = includeDeleted === 'true' || includeDeleted === true;
    const limitNum = Number(limit) || 10;
    const pageNum = Number(page) || 1;

    const result = await this.presupuestoService.findAllPaginated(
      pageNum,
      limitNum,
      search,
      isIncludeDeleted,
    );

    return {
      items: result.data,
      totalItems: result.total,
      totalPages: Math.ceil(result.total / limitNum),
      currentPage: pageNum,
    };
  }

  @Auth('admin', 'tech', 'recep') // Ajusta los roles según necesites
  @Get()
  async findAllSimple(
    @Query('includeDeleted') includeDeleted?: boolean,
    @Query('ordenId') ordenId?: number // Nuevo parámetro opcional
  ) {
    // Si se proporciona ordenId, buscar por orden
    if (ordenId) {
      return this.presupuestoService.findByOrderId(ordenId);
    }
    return this.presupuestoService.findAll(includeDeleted);
  }

  @Auth('tech')
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeDeleted') includeDeleted?: boolean,
  ) {
    return this.presupuestoService.findOne(id, includeDeleted);
  }

  @Auth('admin', 'tech', 'recep') // Ajusta los roles según necesites
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePresupuestoDto,
  ) {
    return this.presupuestoService.update(id, dto);
  }

  @Auth('admin', 'tech', 'recep') // Ajusta los roles según necesites
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      const result = await this.presupuestoService.remove(id);

      if (!result) {
        throw new NotFoundException(`Presupuesto con ID ${id} no encontrado`);
      }

      return {
        success: true,
        message: 'Presupuesto eliminado correctamente',
        deletedId: id
      };
    } catch (error) {
      throw new HttpException(
        error.response || 'Error al eliminar presupuesto',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Auth('tech')
  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number) {
    await this.presupuestoService.restore(id);
    return this.presupuestoService.findOne(id);
  }

  @Auth('client')
  @Get(':id/resumen')
  getResumen(@Param('id', ParseIntPipe) id: number) {
    return this.presupuestoService.getResumenPresupuesto(id);
  }
}