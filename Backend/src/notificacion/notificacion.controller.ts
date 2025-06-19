import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { NotificacionService } from './notificacion.service';
import { CreateNotificacionDto } from './dto/create-notificacion.dto';
import { UpdateNotificacionDto } from './dto/update-notificacion.dto';

@Controller('notificacion')
export class NotificacionController {
  constructor(private readonly notificacionService: NotificacionService) {}

  @Post()
  create(@Body() createNotificacionDto: CreateNotificacionDto) {
    return this.notificacionService.create(createNotificacionDto);
  }

  @Get()
  findAll() {
    return this.notificacionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notificacionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNotificacionDto: UpdateNotificacionDto) {
    return this.notificacionService.update(+id, updateNotificacionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notificacionService.remove(+id);
  }
}
