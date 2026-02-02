import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, UseInterceptors, ClassSerializerInterceptor, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Auth } from '../auth/decorators/auth.decorator';

import { User } from './entities/user.entity';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { Rol } from 'src/rol/entities/rol.entity';

@Auth('admin', 'tech', 'recep') // Ajusta los roles según necesites

@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Auth('admin', 'recep', 'tech')
  @Post()
  create(@Body() dto: CreateUserDto): Promise<User> {
    return this.usersService.create(dto);
  }

  @Auth('admin', 'recep', 'tech')
  @Get('all')
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    const ALLOWED_LIMITS = [10, 25, 50, 100];
    
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

    const result = await this.usersService.findAllPaginated(
      pageNum,
      limitNum,
      search,
      includeInactive,
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
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, dto);
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
  async toggleStatus(@Param('id', ParseIntPipe) id: number): Promise<User> {
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
    console.log('Received data:', updatePasswordDto); // Para depuración
    return this.usersService.updatePassword(
      id,
      updatePasswordDto.currentPassword,
      updatePasswordDto.newPassword
    );
  }
}