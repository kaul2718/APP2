import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EstadoPresupuestoService } from './estado-presupuesto.service';
import { CreateEstadoPresupuestoDto } from './dto/create-estado-presupuesto.dto';
import { UpdateEstadoPresupuestoDto } from './dto/update-estado-presupuesto.dto';

@Controller('estado-presupuesto')
export class EstadoPresupuestoController {
  constructor(private readonly estadoPresupuestoService: EstadoPresupuestoService) {}

  @Post()
  create(@Body() createEstadoPresupuestoDto: CreateEstadoPresupuestoDto) {
    return this.estadoPresupuestoService.create(createEstadoPresupuestoDto);
  }

  @Get()
  findAll() {
    return this.estadoPresupuestoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.estadoPresupuestoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEstadoPresupuestoDto: UpdateEstadoPresupuestoDto) {
    return this.estadoPresupuestoService.update(+id, updateEstadoPresupuestoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.estadoPresupuestoService.remove(+id);
  }
}
