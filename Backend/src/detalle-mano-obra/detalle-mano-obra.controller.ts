import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DetalleManoObraService } from './detalle-mano-obra.service';
import { CreateDetalleManoObraDto } from './dto/create-detalle-mano-obra.dto';
import { UpdateDetalleManoObraDto } from './dto/update-detalle-mano-obra.dto';

@Controller('detalle-mano-obra')
export class DetalleManoObraController {
  constructor(private readonly detalleManoObraService: DetalleManoObraService) {}

  @Post()
  create(@Body() createDetalleManoObraDto: CreateDetalleManoObraDto) {
    return this.detalleManoObraService.create(createDetalleManoObraDto);
  }

  @Get()
  findAll() {
    return this.detalleManoObraService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.detalleManoObraService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDetalleManoObraDto: UpdateDetalleManoObraDto) {
    return this.detalleManoObraService.update(+id, updateDetalleManoObraDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.detalleManoObraService.remove(+id);
  }
}
