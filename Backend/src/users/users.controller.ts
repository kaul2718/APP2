import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  // Crear un nuevo usuario
  @Post()
  @HttpCode(HttpStatus.CREATED) // Establecer el código de respuesta 201
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
  // Obtener todos los usuarios (solo ADMIN)
  @Auth(Role.ADMIN, Role.TECH)
  @Get('all')
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('role') role?: string // El parámetro de rol sigue siendo opcional
  ) {
    if (role) {
      return this.usersService.findAll(page, limit, role); // Filtra por rol
    } else {
      return this.usersService.findAll(page, limit); // Devuelve todos los usuarios si no se pasa rol
    }
  }

  // Obtener un usuario por ID
  @Auth(Role.ADMIN)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const userId = +id;
    if (isNaN(userId)) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `El ID de usuario proporcionado (${id}) no es válido.`,
      };
    }
    return this.usersService.findOne(userId);
  }

  // Actualizar un usuario por ID
  @Auth(Role.ADMIN)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const userId = +id;
    if (isNaN(userId)) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `El identificador de usuario ${id} no es válido o no se encuentra registrado.`,
      };
    }
    return this.usersService.update(userId, updateUserDto);
  }

  // Eliminar un usuario por ID (eliminación lógica)
  @Auth(Role.ADMIN)
  @Patch(':id/soft-delete')
  @HttpCode(HttpStatus.NO_CONTENT) // Establecer código de respuesta 204
  async softDelete(@Param('id') id: string) {
    const userId = +id;
    if (isNaN(userId)) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `El ID de usuario proporcionado (${id}) no es válido.`,
      };
    }
    await this.usersService.softDeleteUser(userId);
  }

  // Restaurar un usuario eliminado lógicamente
  @Auth(Role.ADMIN)
  @Patch(':id/restore')
  @HttpCode(HttpStatus.NO_CONTENT) // Establecer código de respuesta 204
  async restore(@Param('id') id: string) {
    const userId = +id;
    if (isNaN(userId)) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `El ID de usuario proporcionado (${id}) no es válido.`,
      };
    }
    await this.usersService.restoreUser(userId);
  }

  // Eliminar un usuario por ID (eliminación física)
  @Auth(Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Establecer código de respuesta 204
  async remove(@Param('id') id: string) {
    const userId = +id;
    if (isNaN(userId)) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `El ID de usuario proporcionado (${id}) no es válido.`,
      };
    }
    await this.usersService.remove(userId);
  }
}
