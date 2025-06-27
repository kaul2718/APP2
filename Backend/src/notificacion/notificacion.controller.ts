import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  ParseIntPipe,
} from '@nestjs/common';
import { NotificacionService } from './notificacion.service';
import { CreateNotificacionDto } from './dto/create-notificacion.dto';
import { UpdateNotificacionDto } from './dto/update-notificacion.dto';
import { Notificacion } from './entities/notificacion.entity';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';

@Auth(Role.ADMIN, Role.TECH, Role.CLIENT) // Todos los roles pueden acceder, ajusta según necesidad
@Controller('notificaciones')
export class NotificacionController {
  constructor(private readonly notificacionService: NotificacionService) { }

  // Crear una nueva notificación
  @Post()
  async create(@Body() createDto: CreateNotificacionDto): Promise<Notificacion> {
    if (!createDto.usuarioId || !createDto.tipoId || !createDto.mensaje) {
      throw new BadRequestException('usuarioId, tipoId y mensaje son obligatorios.');
    }
    try {
      return await this.notificacionService.create(createDto);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  // Obtener todas las notificaciones
  @Get()
  async findAll(): Promise<Notificacion[]> {
    return await this.notificacionService.findAll();
  }

  // Obtener notificaciones de un usuario específico
  @Get('usuario/:usuarioId')
  async findByUsuario(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
  ): Promise<Notificacion[]> {
    if (isNaN(usuarioId)) {
      throw new BadRequestException('El ID de usuario no es válido.');
    }
    return await this.notificacionService.findByUsuario(usuarioId);
  }

  // Obtener una notificación por ID
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Notificacion> {
    if (isNaN(id)) {
      throw new BadRequestException('El ID no es válido.');
    }
    return await this.notificacionService.findOne(id);
  }

  // Marcar una notificación como leída
  @Patch(':id/leida')
  async marcarComoLeida(@Param('id', ParseIntPipe) id: number): Promise<Notificacion> {
    if (isNaN(id)) {
      throw new BadRequestException('El ID no es válido.');
    }
    return await this.notificacionService.marcarComoLeida(id);
  }

  // Actualizar notificación (mensaje o tipo)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateNotificacionDto,
  ): Promise<Notificacion> {
    if (isNaN(id)) {
      throw new BadRequestException('El ID no es válido.');
    }
    return await this.notificacionService.update(id, updateDto);
  }

  // Eliminar (soft delete) una notificación
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    if (isNaN(id)) {
      throw new BadRequestException('El ID no es válido.');
    }
    return await this.notificacionService.remove(id);
  }

  @Patch('usuario/:usuarioId/leidas')
  async marcarTodasComoLeidas(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
  ): Promise<{ message: string }> {
    if (isNaN(usuarioId)) {
      throw new BadRequestException('El ID de usuario no es válido.');
    }
    await this.notificacionService.marcarTodasComoLeidas(usuarioId);
    return { message: `Todas las notificaciones para usuario ${usuarioId} marcadas como leídas.` };
  }

}
