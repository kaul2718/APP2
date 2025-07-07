import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { TipoNotificacionService } from './tipo-notificacion.service';
import { CreateTipoNotificacionDto } from './dto/create-tipo-notificacion.dto';
import { UpdateTipoNotificacionDto } from './dto/update-tipo-notificacion.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { Role } from '../common/enums/rol.enum';
import { TipoNotificacion } from './entities/tipo-notificacion.entity';

@Auth(Role.ADMIN)
@Controller('tipos-notificacion')
export class TipoNotificacionController {
  constructor(private readonly tipoNotificacionService: TipoNotificacionService) {}

  @Post()
  create(@Body() dto: CreateTipoNotificacionDto): Promise<TipoNotificacion> {
    return this.tipoNotificacionService.create(dto);
  }

  @Get('all')
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    const result = await this.tipoNotificacionService.findAllPaginated(
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
  ): Promise<TipoNotificacion> {
    return this.tipoNotificacionService.findOne(id, includeInactive);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTipoNotificacionDto,
  ): Promise<TipoNotificacion> {
    return this.tipoNotificacionService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.tipoNotificacionService.remove(id);
  }

  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.tipoNotificacionService.restore(id);
  }

  @Patch(':id/estado')
  async cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: boolean,
  ): Promise<TipoNotificacion> {
    return this.tipoNotificacionService.update(id, { estado });
  }

  @Patch(':id/toggle-estado')
  async toggleEstado(@Param('id', ParseIntPipe) id: number): Promise<TipoNotificacion> {
    return this.tipoNotificacionService.toggleStatus(id);
  }
}