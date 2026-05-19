import { Controller, Get, Post, Put, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { RolService } from './rol.service';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import { AuthGuard } from '../auth/guard/auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../decorators/roles.decorator';


@Controller('roles')
@UseGuards(AuthGuard, RolesGuard)
export class RolController {
  constructor(private readonly rolService: RolService) {}

  @Post()
  @Roles('admin')
  create(@Body() createRolDto: CreateRolDto) {
    return this.rolService.create(createRolDto);
  }

  @Get()
  @Roles('admin')
  findAll() {
    return this.rolService.findAll();
  }

  @Get(':id')
  @Roles('admin')
  findOne(@Param('id') id: string) {
    return this.rolService.findOne(+id);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() updateRolDto: UpdateRolDto) {
    return this.rolService.update(+id, updateRolDto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.rolService.remove(+id);
  }

  @Post(':roleId/permissions/:permissionId')
  @Roles('admin')
  async assignPermission(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    await this.rolService.assignPermissions(+roleId, [+permissionId]);
    return { message: 'Permiso asignado correctamente' };
  }

  @Get(':roleId/permissions')
  @Roles('admin')
  getPermissions(@Param('roleId') roleId: string) {
    return this.rolService.getPermissions(+roleId);
  }

  /** Bulk-replace all permissions for a role (used by matrix UI) */
  @Put(':roleId/permissions')
  @Roles('admin')
  async setPermissions(
    @Param('roleId') roleId: string,
    @Body() body: { permissionIds: number[] },
  ) {
    await this.rolService.setPermissions(+roleId, body.permissionIds);
    return { message: 'Permisos actualizados correctamente' };
  }

  /** Remove a single permission from a role */
  @Delete(':roleId/permissions/:permissionId')
  @Roles('admin')
  async removePermission(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    await this.rolService.removePermission(+roleId, +permissionId);
    return { message: 'Permiso eliminado del rol correctamente' };
  }
}
