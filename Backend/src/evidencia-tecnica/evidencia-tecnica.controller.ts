import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EvidenciaTecnicaService } from './evidencia-tecnica.service';
import { CreateEvidenciaTecnicaDto } from './dto/create-evidencia-tecnica.dto';
import { UpdateEvidenciaTecnicaDto } from './dto/update-evidencia-tecnica.dto';

@Controller('evidencia-tecnica')
export class EvidenciaTecnicaController {
  constructor(private readonly evidenciaTecnicaService: EvidenciaTecnicaService) {}

  @Post()
  create(@Body() createEvidenciaTecnicaDto: CreateEvidenciaTecnicaDto) {
    return this.evidenciaTecnicaService.create(createEvidenciaTecnicaDto);
  }

  @Get()
  findAll() {
    return this.evidenciaTecnicaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.evidenciaTecnicaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEvidenciaTecnicaDto: UpdateEvidenciaTecnicaDto) {
    return this.evidenciaTecnicaService.update(+id, updateEvidenciaTecnicaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.evidenciaTecnicaService.remove(+id);
  }
}
