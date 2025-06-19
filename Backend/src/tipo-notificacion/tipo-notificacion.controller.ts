import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TipoNotificacionService } from './tipo-notificacion.service';
import { CreateTipoNotificacionDto } from './dto/create-tipo-notificacion.dto';
import { UpdateTipoNotificacionDto } from './dto/update-tipo-notificacion.dto';

@Controller('tipo-notificacion')
export class TipoNotificacionController {
  constructor(private readonly tipoNotificacionService: TipoNotificacionService) {}

  @Post()
  create(@Body() createTipoNotificacionDto: CreateTipoNotificacionDto) {
    return this.tipoNotificacionService.create(createTipoNotificacionDto);
  }

  @Get()
  findAll() {
    return this.tipoNotificacionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tipoNotificacionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTipoNotificacionDto: UpdateTipoNotificacionDto) {
    return this.tipoNotificacionService.update(+id, updateTipoNotificacionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tipoNotificacionService.remove(+id);
  }
}
