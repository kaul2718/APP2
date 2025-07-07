import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { CasilleroService } from './casillero.service';
import { CreateCasilleroDto } from './dto/create-casillero.dto';
import { UpdateCasilleroDto } from './dto/update-casillero.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { Role } from '../common/enums/rol.enum';
import { Casillero } from './entities/casillero.entity';
import { EstadoCasillero } from 'src/common/enums/estadoCasillero.enum';

@Auth(Role.ADMIN)
@Controller('casilleros')
export class CasilleroController {
  constructor(private readonly casilleroService: CasilleroService) {}

  @Post()
  create(@Body() dto: CreateCasilleroDto): Promise<Casillero> {
    return this.casilleroService.create(dto);
  }

  @Get('all')
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: boolean,
    @Query('situacion') situacion?: string,
  ) {
    const result = await this.casilleroService.findAllPaginated(
      page,
      limit,
      search,
      includeInactive,
      situacion as EstadoCasillero,
    );

    return {
      items: result.data,
      totalItems: result.total,
      totalPages: Math.ceil(result.total / limit),
      currentPage: page,
    };
  }

  @Get('disponibles')
  async findAvailable(): Promise<Casillero[]> {
    return this.casilleroService.findAvailable();
  }

  @Get('ocupados')
  async findOccupied(): Promise<Casillero[]> {
    return this.casilleroService.findOccupied();
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeInactive') includeInactive?: boolean,
  ): Promise<Casillero> {
    return this.casilleroService.findOne(id, includeInactive);
  }

  @Get('codigo/:codigo')
  findByCode(
    @Param('codigo') codigo: string,
    @Query('includeInactive') includeInactive?: boolean,
  ): Promise<Casillero> {
    return this.casilleroService.findByCode(codigo, includeInactive);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCasilleroDto,
  ): Promise<Casillero> {
    return this.casilleroService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<Casillero> {
    await this.casilleroService.remove(id);
    return this.casilleroService.findOne(id, true); // devuelve el soft deleted
  }

  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number): Promise<Casillero> {
    await this.casilleroService.restore(id);
    return this.casilleroService.findOne(id); // devuelve restaurado
  }

  @Patch(':id/estado')
  async cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: boolean,
  ): Promise<Casillero> {
    return this.casilleroService.update(id, { estado });
  }

  @Patch(':id/toggle-estado')
  async toggleEstado(@Param('id', ParseIntPipe) id: number): Promise<Casillero> {
    return this.casilleroService.toggleStatus(id);
  }

  @Patch(':id/asignar-orden/:orderId')
  async assignOrder(
    @Param('id', ParseIntPipe) id: number,
    @Param('orderId', ParseIntPipe) orderId: number,
  ): Promise<Casillero> {
    return this.casilleroService.assignOrder(id, orderId);
  }

  @Patch(':id/liberar')
  async releaseCasillero(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Casillero> {
    return this.casilleroService.releaseCasillero(id);
  }
}