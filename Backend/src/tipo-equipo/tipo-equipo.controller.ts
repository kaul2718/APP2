import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TipoEquipoService } from './tipo-equipo.service';
import { CreateTipoEquipoDto } from './dto/create-tipo-equipo.dto';
import { UpdateTipoEquipoDto } from './dto/update-tipo-equipo.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';

@Auth(Role.ADMIN)
@Controller('tipo-equipo')
export class TipoEquipoController {
  constructor(private readonly tipoEquipoService: TipoEquipoService) {}

  @Post()
  create(@Body() createDto: CreateTipoEquipoDto) {
    return this.tipoEquipoService.create(createDto);
  }

  @Get()
  findAll() {
    return this.tipoEquipoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tipoEquipoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateTipoEquipoDto) {
    return this.tipoEquipoService.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tipoEquipoService.remove(+id);
  }
}
