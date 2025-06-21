import { Controller, Get, Post, Patch, Delete, Param, Body, BadRequestException } from '@nestjs/common';
import { PresupuestoService } from './presupuesto.service';
import { CreatePresupuestoDto } from './dto/create-presupuesto.dto';
import { UpdatePresupuestoDto } from './dto/update-presupuesto.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';

@Auth(Role.ADMIN)
@Controller('presupuestos')
export class PresupuestoController {
  constructor(private readonly presupuestoService: PresupuestoService) {}

  @Auth(Role.TECH)
  @Post()
  async create(@Body() createDto: CreatePresupuestoDto) {
    return this.presupuestoService.create(createDto);
  }

  @Auth(Role.TECH)
  @Get()
  async findAll() {
    return this.presupuestoService.findAll();
  }

  @Auth(Role.TECH)
  @Get(':id')
  async findOne(@Param('id') id: number) {
    if (isNaN(id)) throw new BadRequestException('ID inválido');
    return this.presupuestoService.findOne(id);
  }

  @Auth(Role.TECH)
  @Patch(':id')
  async update(@Param('id') id: number, @Body() updateDto: UpdatePresupuestoDto) {
    if (isNaN(id)) throw new BadRequestException('ID inválido');
    return this.presupuestoService.update(id, updateDto);
  }

  @Auth(Role.TECH)
  @Delete(':id')
  async remove(@Param('id') id: number) {
    if (isNaN(id)) throw new BadRequestException('ID inválido');
    return this.presupuestoService.remove(id);
  }
}
