import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EstadoOrdenService } from './estado-orden.service';
import { CreateEstadoOrdenDto } from './dto/create-estado-orden.dto';
import { UpdateEstadoOrdenDto } from './dto/update-estado-orden.dto';

@Controller('estado-orden')
export class EstadoOrdenController {
  constructor(private readonly estadoOrdenService: EstadoOrdenService) {}

  @Post()
  create(@Body() createEstadoOrdenDto: CreateEstadoOrdenDto) {
    return this.estadoOrdenService.create(createEstadoOrdenDto);
  }

  @Get()
  findAll() {
    return this.estadoOrdenService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.estadoOrdenService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEstadoOrdenDto: UpdateEstadoOrdenDto) {
    return this.estadoOrdenService.update(+id, updateEstadoOrdenDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.estadoOrdenService.remove(+id);
  }
}
