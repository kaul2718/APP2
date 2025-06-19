import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { HistorialEstadoOrdenService } from './historial-estado-orden.service';
import { CreateHistorialEstadoOrdenDto } from './dto/create-historial-estado-orden.dto';
import { UpdateHistorialEstadoOrdenDto } from './dto/update-historial-estado-orden.dto';

@Controller('historial-estado-orden')
export class HistorialEstadoOrdenController {
  constructor(private readonly historialEstadoOrdenService: HistorialEstadoOrdenService) {}

  @Post()
  create(@Body() createHistorialEstadoOrdenDto: CreateHistorialEstadoOrdenDto) {
    return this.historialEstadoOrdenService.create(createHistorialEstadoOrdenDto);
  }

  @Get()
  findAll() {
    return this.historialEstadoOrdenService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.historialEstadoOrdenService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHistorialEstadoOrdenDto: UpdateHistorialEstadoOrdenDto) {
    return this.historialEstadoOrdenService.update(+id, updateHistorialEstadoOrdenDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.historialEstadoOrdenService.remove(+id);
  }
}
