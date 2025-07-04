
import {Controller,Get,Post,Body,Patch,Param,Delete,ParseIntPipe,Query} from '@nestjs/common';
import { EspecificacionParteService } from './especificacion-parte.service';
import { CreateEspecificacionParteDto } from './dto/create-especificacion-parte.dto';
import { UpdateEspecificacionParteDto } from './dto/update-especificacion-parte.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { Role } from '../common/enums/rol.enum';
import { EspecificacionParte } from './entities/especificacion-parte.entity';

@Auth(Role.ADMIN)
@Controller('especificaciones-parte')
export class EspecificacionParteController {
  constructor(
    private readonly especificacionService: EspecificacionParteService
  ) { }

  @Post()
  create(@Body() dto: CreateEspecificacionParteDto): Promise<EspecificacionParte> {
    return this.especificacionService.create(dto);
  }

  @Get('all')
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    const result = await this.especificacionService.findAllPaginated(
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

  @Get('by-parte/:parteId')
  async findByParte(
    @Param('parteId', ParseIntPipe) parteId: number,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    return this.especificacionService.findByParte(parteId, includeInactive);
  }

  @Get('by-tipo/:tipoId')
  async findByTipo(
    @Param('tipoId', ParseIntPipe) tipoId: number,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    return this.especificacionService.findByTipoEspecificacion(tipoId, includeInactive);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeInactive') includeInactive?: boolean,
  ): Promise<EspecificacionParte> {
    return this.especificacionService.findOne(id, includeInactive);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEspecificacionParteDto,
  ): Promise<EspecificacionParte> {
    return this.especificacionService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<EspecificacionParte> {
    await this.especificacionService.remove(id);
    return this.especificacionService.findOne(id, true); // devuelve el soft deleted
  }

  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number): Promise<EspecificacionParte> {
    await this.especificacionService.restore(id);
    return this.especificacionService.findOne(id); // devuelve restaurado
  }

  @Patch(':id/estado')
  async cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: boolean,
  ): Promise<EspecificacionParte> {
    return this.especificacionService.update(id, { estado });
  }

  @Patch(':id/toggle-estado')
  async toggleEstado(@Param('id', ParseIntPipe) id: number): Promise<EspecificacionParte> {
    return this.especificacionService.toggleStatus(id);
  }
}