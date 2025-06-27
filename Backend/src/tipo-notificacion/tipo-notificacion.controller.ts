import {Controller,Get,Post,Patch,Delete,Param,Body,BadRequestException,NotFoundException,} from '@nestjs/common';
import { TipoNotificacionService } from './tipo-notificacion.service';
import { CreateTipoNotificacionDto } from './dto/create-tipo-notificacion.dto';
import { UpdateTipoNotificacionDto } from './dto/update-tipo-notificacion.dto';
import { TipoNotificacion } from './entities/tipo-notificacion.entity';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';

@Auth(Role.ADMIN)
@Controller('tipos-notificacion')
export class TipoNotificacionController {
  constructor(private readonly tipoService: TipoNotificacionService) {}

  @Auth(Role.ADMIN)
  @Post()
  async create(@Body() dto: CreateTipoNotificacionDto): Promise<TipoNotificacion> {
    if (!dto.nombre || !dto.descripcion) {
      throw new BadRequestException('Nombre y descripción son requeridos.');
    }

    return await this.tipoService.create(dto);
  }

  @Auth(Role.ADMIN, Role.TECH)
  @Get()
  async findAll(): Promise<TipoNotificacion[]> {
    return await this.tipoService.findAll();
  }

  @Auth(Role.ADMIN, Role.TECH)
  @Get(':id')
  async findOne(@Param('id') id: number): Promise<TipoNotificacion> {
    if (isNaN(id)) throw new BadRequestException('ID inválido.');
    return await this.tipoService.findOne(id);
  }

  @Auth(Role.ADMIN)
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: UpdateTipoNotificacionDto,
  ): Promise<TipoNotificacion> {
    if (isNaN(id)) throw new BadRequestException('ID inválido.');
    return await this.tipoService.update(id, dto);
  }

  @Auth(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<{ message: string }> {
    if (isNaN(id)) throw new BadRequestException('ID inválido.');
    return await this.tipoService.remove(id);
  }
}
