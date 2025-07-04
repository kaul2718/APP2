import {Controller,Get,Post,Body,Patch,Param,Delete,ParseIntPipe,Query,} from '@nestjs/common';
import { TipoEspecificacionService } from './tipo-especificacion.service';
import { CreateTipoEspecificacionDto } from './dto/create-tipo-especificacion.dto';
import { UpdateTipoEspecificacionDto } from './dto/update-tipo-especificacion.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { Role } from '../common/enums/rol.enum';
import { TipoEspecificacion } from './entities/tipo-especificacion.entity';

@Controller('tipo-especificacion')
@Auth() // Todos los endpoints requieren autenticación por defecto
export class TipoEspecificacionController {
  constructor(private readonly service: TipoEspecificacionService) {}

  @Post()
  @Auth(Role.ADMIN)
  create(@Body() dto: CreateTipoEspecificacionDto): Promise<TipoEspecificacion> {
    return this.service.create(dto);
  }

  @Get('all')
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    const result = await this.service.findAllPaginated(
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
  ): Promise<TipoEspecificacion> {
    return this.service.findOne(id, includeInactive);
  }

  @Patch(':id')
  @Auth(Role.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTipoEspecificacionDto,
  ): Promise<TipoEspecificacion> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Auth(Role.ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<TipoEspecificacion> {
    await this.service.remove(id);
    return this.service.findOne(id, true); // devuelve el soft deleted
  }

  @Patch(':id/restore')
  @Auth(Role.ADMIN)
  async restore(@Param('id', ParseIntPipe) id: number): Promise<TipoEspecificacion> {
    await this.service.restore(id);
    return this.service.findOne(id); // devuelve restaurado
  }

  @Patch(':id/estado')
  @Auth(Role.ADMIN)
  async cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: boolean,
  ): Promise<TipoEspecificacion> {
    return this.service.update(id, { estado });
  }

  @Patch(':id/toggle-estado')
  @Auth(Role.ADMIN)
  async toggleEstado(@Param('id', ParseIntPipe) id: number): Promise<TipoEspecificacion> {
    return this.service.toggleStatus(id);
  }

  // Mantenemos el endpoint simple para compatibilidad
  @Get()
  async findAllSimple(): Promise<TipoEspecificacion[]> {
    return this.service.findAll();
  }
}