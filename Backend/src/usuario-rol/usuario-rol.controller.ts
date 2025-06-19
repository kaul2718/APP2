import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UsuarioRolService } from './usuario-rol.service';
import { CreateUsuarioRolDto } from './dto/create-usuario-rol.dto';
import { UpdateUsuarioRolDto } from './dto/update-usuario-rol.dto';

@Controller('usuario-rol')
export class UsuarioRolController {
  constructor(private readonly usuarioRolService: UsuarioRolService) {}

  @Post()
  create(@Body() createUsuarioRolDto: CreateUsuarioRolDto) {
    return this.usuarioRolService.create(createUsuarioRolDto);
  }

  @Get()
  findAll() {
    return this.usuarioRolService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usuarioRolService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUsuarioRolDto: UpdateUsuarioRolDto) {
    return this.usuarioRolService.update(+id, updateUsuarioRolDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usuarioRolService.remove(+id);
  }
}
