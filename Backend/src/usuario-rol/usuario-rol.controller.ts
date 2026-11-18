import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { UsuarioRolService } from './usuario-rol.service';
import { CreateUsuarioRolDto } from './dto/create-usuario-rol.dto';
import { UpdateUsuarioRolDto } from './dto/update-usuario-rol.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { RequirePermissions } from '../decorators/permissions.decorator';


@Controller('user-roles')
@Auth('admin')
@RequirePermissions('roles.manage')
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
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioRolService.findOne(id);
  }

  @Get('user/:userId')
  findByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return this.usuarioRolService.findByUserId(userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUsuarioRolDto: UpdateUsuarioRolDto,
  ) {
    return this.usuarioRolService.update(id, updateUsuarioRolDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioRolService.remove(id);
  }

  @Post(':userId/assign/:roleId')
  assignRole(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ) {
    return this.usuarioRolService.assignRoleToUser(userId, roleId);
  }

  @Delete(':userId/remove/:roleId')
  removeRole(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ) {
    return this.usuarioRolService.removeRoleFromUser(userId, roleId);
  }
}
