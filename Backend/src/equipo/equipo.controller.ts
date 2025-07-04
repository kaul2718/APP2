import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  Query,
  ParseIntPipe,
  UsePipes,
} from '@nestjs/common';
import { EquipoService } from './equipo.service';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { UpdateEquipoDto } from './dto/update-equipo.dto';
import { Equipo } from './entities/equipo.entity';
import { Auth } from '../auth/decorators/auth.decorator';
import { Role } from '../common/enums/rol.enum';
import { TrimPipe } from '../common/pipes/trim.pipe';

@Auth(Role.ADMIN)
@Controller('equipos')
export class EquipoController {
  constructor(private readonly equipoService: EquipoService) {}

  @Post()
  @UsePipes(TrimPipe)
  create(@Body() dto: CreateEquipoDto): Promise<Equipo> {
    return this.equipoService.create(dto);
  }

  @Get('all')
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('includeDeleted') includeDeleted?: boolean,
  ) {
    const result = await this.equipoService.findAllPaginated(
      page,
      limit,
      search,
      includeDeleted,
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
    @Query('includeDeleted') includeDeleted?: boolean,
  ): Promise<Equipo> {
    return this.equipoService.findOne(id, includeDeleted);
  }

  @Patch(':id')
  @UsePipes(TrimPipe)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEquipoDto,
  ): Promise<Equipo> {
    return this.equipoService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<Equipo> {
    await this.equipoService.remove(id);
    return this.equipoService.findOne(id, true); // devuelve el soft deleted
  }

  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number): Promise<Equipo> {
    await this.equipoService.restore(id);
    return this.equipoService.findOne(id); // devuelve restaurado
  }

  @Patch(':id/estado')
  async cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: boolean,
  ): Promise<Equipo> {
    return this.equipoService.actualizarEstado(id, estado);
  }

  @Patch(':id/toggle-estado')
  async toggleEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: boolean,
  ): Promise<Equipo> {
    return this.equipoService.actualizarEstado(id, estado);
  }
}