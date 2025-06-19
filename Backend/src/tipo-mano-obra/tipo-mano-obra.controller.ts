import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TipoManoObraService } from './tipo-mano-obra.service';
import { CreateTipoManoObraDto } from './dto/create-tipo-mano-obra.dto';
import { UpdateTipoManoObraDto } from './dto/update-tipo-mano-obra.dto';

@Controller('tipo-mano-obra')
export class TipoManoObraController {
  constructor(private readonly tipoManoObraService: TipoManoObraService) {}

  @Post()
  create(@Body() createTipoManoObraDto: CreateTipoManoObraDto) {
    return this.tipoManoObraService.create(createTipoManoObraDto);
  }

  @Get()
  findAll() {
    return this.tipoManoObraService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tipoManoObraService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTipoManoObraDto: UpdateTipoManoObraDto) {
    return this.tipoManoObraService.update(+id, updateTipoManoObraDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tipoManoObraService.remove(+id);
  }
}
