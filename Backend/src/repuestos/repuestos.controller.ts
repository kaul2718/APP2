import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { RepuestosService } from './repuestos.service';
import { CreateRepuestoDto } from './dto/create-repuesto.dto';
import { UpdateRepuestoDto } from './dto/update-repuesto.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { Role } from '../common/enums/rol.enum';
import { Repuesto } from './entities/repuesto.entity';

@Auth(Role.ADMIN)
@Controller('repuestos')
export class RepuestosController {
  constructor(private readonly repuestosService: RepuestosService) {}

  @Post()
  create(@Body() dto: CreateRepuestoDto): Promise<Repuesto> {
    return this.repuestosService.create(dto);
  }

  @Get('all')
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    const result = await this.repuestosService.findAllPaginated(
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
  ): Promise<Repuesto> {
    return this.repuestosService.findOne(id, includeInactive);
  }

  @Get('codigo/:codigo')
  findByCodigo(
    @Param('codigo') codigo: string,
    @Query('includeInactive') includeInactive?: boolean,
  ): Promise<Repuesto> {
    return this.repuestosService.findByCodigo(codigo, includeInactive);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRepuestoDto,
  ): Promise<Repuesto> {
    return this.repuestosService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.repuestosService.remove(id);
  }

  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.repuestosService.restore(id);
  }

  @Patch(':id/estado')
  async cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: boolean,
  ): Promise<Repuesto> {
    return this.repuestosService.update(id, { estado });
  }

  @Patch(':id/toggle-estado')
  async toggleEstado(@Param('id', ParseIntPipe) id: number): Promise<Repuesto> {
    return this.repuestosService.toggleStatus(id);
  }

  @Get()
  async findAllSimple(
    @Query('includeInactive') includeInactive?: boolean,
  ): Promise<Repuesto[]> {
    return this.repuestosService.findAll(includeInactive);
  }
}