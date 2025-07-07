import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { Role } from '../common/enums/rol.enum';
import { User } from './entities/user.entity';
import { UpdatePasswordDto } from './dto/update-password.dto';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Auth(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateUserDto): Promise<User> {
    return this.usersService.create(dto);
  }

  @Auth(Role.ADMIN, Role.RECEP)
  @Get('all')
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    const result = await this.usersService.findAllPaginated(
      page,
      limit,
      search,
      includeInactive,
    );

    return {
      items: result.data,
      totalItems: result.total,
      totalPages: Math.ceil(result.total / limit),
      currentPage: page,
    };
  }

  @Auth(Role.ADMIN, Role.RECEP, Role.TECH)
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeInactive') includeInactive?: boolean,
  ): Promise<User> {
    return this.usersService.findOne(id, includeInactive);
  }

  @Auth(Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, dto);
  }

  @Auth(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.usersService.remove(id);
  }

  @Auth(Role.ADMIN)
  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.usersService.restore(id);
  }

  @Auth(Role.ADMIN)
  @Patch(':id/toggle-status')
  async toggleStatus(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.usersService.toggleStatus(id);
  }

  @Auth(Role.ADMIN)
  @Get('count/:role')
  async countByRole(@Param('role') role: Role): Promise<number> {
    return this.usersService.countByRole(role);
  }
  @Auth()
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