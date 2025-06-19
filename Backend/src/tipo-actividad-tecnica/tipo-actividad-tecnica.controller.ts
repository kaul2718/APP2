import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TipoActividadTecnicaService } from './tipo-actividad-tecnica.service';
import { CreateTipoActividadTecnicaDto } from './dto/create-tipo-actividad-tecnica.dto';
import { UpdateTipoActividadTecnicaDto } from './dto/update-tipo-actividad-tecnica.dto';

@Controller('tipo-actividad-tecnica')
export class TipoActividadTecnicaController {
  constructor(private readonly tipoActividadTecnicaService: TipoActividadTecnicaService) {}

  @Post()
  create(@Body() createTipoActividadTecnicaDto: CreateTipoActividadTecnicaDto) {
    return this.tipoActividadTecnicaService.create(createTipoActividadTecnicaDto);
  }

  @Get()
  findAll() {
    return this.tipoActividadTecnicaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tipoActividadTecnicaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTipoActividadTecnicaDto: UpdateTipoActividadTecnicaDto) {
    return this.tipoActividadTecnicaService.update(+id, updateTipoActividadTecnicaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tipoActividadTecnicaService.remove(+id);
  }
}
