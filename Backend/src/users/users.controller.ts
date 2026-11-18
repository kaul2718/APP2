import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, UseInterceptors, ClassSerializerInterceptor, BadRequestException, ForbiddenException, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/user.decorator';

import { User } from './entities/user.entity';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { Rol } from 'src/rol/entities/rol.entity';
import { resolveUserAuthContext, userHasRole } from '../common/helpers/role.helper';

@Auth('admin', 'tech', 'recep') // Ajusta los roles según necesites

@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Auth('admin', 'recep')
  @Post()
  create(
    @CurrentUser() user: any,
    @Body() dto: CreateUserDto
  ): Promise<User> {
    const actorRoles: string[] = (user?.userRoles || [])
      .map((ur: any) => ur.rol?.slug)
      .filter(Boolean);
    if (actorRoles.length === 0 && user?.role) {
      actorRoles.push(user.role);
    }
    const isAdmin = actorRoles.includes('admin');
    if (!isAdmin) {
      dto.role = 'client';
      dto.roleIds = undefined;
    }
    return this.usersService.create(dto);
  }

  @Auth('admin', 'recep', 'tech')
  @Get('all')
  async findAll(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: boolean,
    @Query('role') role?: string,
    @Query('habilitadoTecnico') habilitadoTecnico?: string,
    @Query('forOrderClient') forOrderClient?: string,
  ) {
    const ALLOWED_LIMITS = [10, 25, 50, 100, 200, 1000, 10000];
    
    // Convertir y validar page
    const pageNum = page ? parseInt(page, 10) : 1;
    if (pageNum < 1 || isNaN(pageNum)) {
      throw new BadRequestException('page debe ser un número mayor a 0');
    }

    // Convertir y validar limit
    let limitNum = limit ? parseInt(limit, 10) : 10;
    if (isNaN(limitNum) || !ALLOWED_LIMITS.includes(limitNum)) {
      limitNum = 10; // Default seguro
    }

    const actorRoles = resolveUserAuthContext(user).roles;
    const isAdmin = actorRoles.includes('admin');
    const isRecepOnly = actorRoles.includes('recep') && !isAdmin;
    const isForOrderClient = forOrderClient === 'true';

    const parsedHabilitadoTecnico =
      habilitadoTecnico === 'true' ? true : habilitadoTecnico === 'false' ? false : undefined;

    // Si es recepcionista (sin ser admin), restringir listados generales a clientes/técnicos, búsqueda para orden o técnicos habilitados
    let finalRole = role;
    if (isForOrderClient) {
      finalRole = 'all';
    } else if (parsedHabilitadoTecnico === true) {
      finalRole = role || 'all';
    } else if (isRecepOnly) {
      if (role !== 'client' && role !== 'tech') {
        finalRole = 'client';
      }
    }

    const result = await this.usersService.findAllPaginated(
      pageNum,
      limitNum,
      search,
      includeInactive,
      finalRole,
      parsedHabilitadoTecnico,
    );

    return {
      items: result.data,
      totalItems: result.total,
      currentPage: pageNum,
      totalPages: Math.ceil(result.total / limitNum),
    };
  }

  @Auth('admin', 'recep', 'tech', 'client')
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeInactive') includeInactive?: boolean,
  ): Promise<User> {
    return this.usersService.findOne(id, includeInactive);
  }

  @Auth('admin', 'recep', 'tech')
  @Get(':id/report')
  async getUserReport(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.getUserReport(id);
  }

  @Auth('admin', 'recep', 'tech', 'client')
  @Patch(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ): Promise<User> {
    const actorRoles: string[] = (user?.userRoles || [])
      .map((ur: any) => ur.rol?.slug)
      .filter(Boolean);
    if (actorRoles.length === 0 && user?.role) {
      actorRoles.push(user.role);
    }
    const isAdmin = actorRoles.includes('admin');
    const isRecep = actorRoles.includes('recep');
    const actorId = Number(user?.sub || user?.id);

    if (!isAdmin && !isRecep && actorId !== id) {
      throw new ForbiddenException('Solo puede editar su propio perfil.');
    }

    const dtoRole = (dto as any).role;
    if (!isAdmin) {
      if (isRecep) {
        if (dtoRole !== undefined && dtoRole !== 'client') {
          throw new ForbiddenException('Solo un administrador puede asignar roles distintos a cliente.');
        }
        if (dto.roleIds !== undefined) {
          throw new ForbiddenException('Solo un administrador puede modificar los roles de un usuario.');
        }
      } else {
        if (dto.roleIds !== undefined || (dtoRole !== undefined && !actorRoles.includes(dtoRole))) {
          throw new ForbiddenException('Solo un administrador puede modificar los roles de un usuario.');
        }
      }
    }

    return this.usersService.update(id, dto, isAdmin ? 'admin' : (isRecep ? 'recep' : user.role));
  }

  @Auth('admin')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.usersService.remove(id);
  }

  @Auth('admin')
  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.usersService.restore(id);
  }

  @Auth('admin', 'recep', 'tech')
  @Patch(':id/toggle-status')
  async toggleStatus(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number
  ): Promise<User> {
    const actorRoles = resolveUserAuthContext(user).roles;
    if (actorRoles.includes('recep') && !actorRoles.includes('admin')) {
      const userToToggle = await this.usersService.findOne(id, true);
      const targetRoles = resolveUserAuthContext(userToToggle).roles;
      const isOnlyClient =
        targetRoles.length === 0 || targetRoles.every((r) => r === 'client');
      if (!isOnlyClient) {
        throw new BadRequestException('Un recepcionista solo puede cambiar el estado de usuarios con rol cliente');
      }
    }
    return this.usersService.toggleStatus(id);
  }

  @Auth('admin', 'recep', 'tech')
  @Get('count/:roleSlug')
  async countByRole(@Param('roleSlug') roleSlug: string): Promise<number> {
    return this.usersService.countByRole(roleSlug);
  }


  @Auth('admin', 'recep', 'tech', 'client')
  @Patch(':id/password')
  async updatePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return this.usersService.updatePassword(
      id,
      updatePasswordDto.currentPassword,
      updatePasswordDto.newPassword
    );
  }

  /**
   * Sube o actualiza la foto de perfil del usuario en Cloudflare R2
   */
  @Auth('admin', 'recep', 'tech', 'client')
  @Post(':id/avatar')
  @UseInterceptors(
    FileInterceptor('foto', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máx
    }),
  )
  async subirAvatar(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Debe adjuntar una imagen válida (PNG, JPG o WEBP).');
    }
    const mimeTypesPermitidos = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!mimeTypesPermitidos.includes(file.mimetype)) {
      throw new BadRequestException('El formato de imagen debe ser PNG, JPG o WEBP.');
    }
    return await this.usersService.subirAvatar(id, file.buffer, file.mimetype);
  }

  /**
   * Elimina la foto de perfil y vuelve al icono/iniciales por defecto
   */
  @Auth('admin', 'recep', 'tech', 'client')
  @Delete(':id/avatar')
  async eliminarAvatar(@Param('id', ParseIntPipe) id: number) {
    await this.usersService.eliminarAvatar(id);
    return { success: true, message: 'Foto de perfil eliminada' };
  }
}