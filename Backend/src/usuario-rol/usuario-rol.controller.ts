import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { UsuarioRolService } from './usuario-rol.service';
import { CreateUsuarioRolDto } from './dto/create-usuario-rol.dto';
import { UpdateUsuarioRolDto } from './dto/update-usuario-rol.dto';
import { AuthGuard } from '../auth/guard/auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../decorators/roles.decorator';


@Controller('user-roles')
@UseGuards(AuthGuard, RolesGuard)
export class UsuarioRolController {
  constructor(private readonly usuarioRolService: UsuarioRolService) {}

  @Post()
  @Roles('admin')
  create(@Body() createUsuarioRolDto: CreateUsuarioRolDto) {
    return this.usuarioRolService.create(createUsuarioRolDto);
  }

  @Get()
  @Roles('admin')
  findAll() {
    return this.usuarioRolService.findAll();
  }

  @Get(':id')
  @Roles('admin')
  findOne(@Param('id') id: string) {
    return this.usuarioRolService.findOne(+id);
  }

  @Get('user/:userId')
  @Roles('admin')
  findByUserId(@Param('userId') userId: string) {
    return this.usuarioRolService.findByUserId(+userId);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() updateUsuarioRolDto: UpdateUsuarioRolDto) {
    return this.usuarioRolService.update(+id, updateUsuarioRolDto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.usuarioRolService.remove(+id);
  }

  @Post(':userId/assign/:roleId')
  @UseGuards(AuthGuard)
  assignRole(@Param('userId') userId: string, @Param('roleId') roleId: string) {
    return this.usuarioRolService.assignRoleToUser(+userId, +roleId);
  }

  @Delete(':userId/remove/:roleId')
  @Roles('admin')
  removeRole(@Param('userId') userId: string, @Param('roleId') roleId: string) {
    return this.usuarioRolService.removeRoleFromUser(+userId, +roleId);
  }
}
