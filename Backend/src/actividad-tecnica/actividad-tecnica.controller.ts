import { Controller, Get, Post, Patch, Delete, Param, Body, BadRequestException, NotFoundException } from '@nestjs/common';
import { ActividadTecnicaService } from './actividad-tecnica.service';
import { CreateActividadTecnicaDto } from './dto/create-actividad-tecnica.dto';
import { UpdateActividadTecnicaDto } from './dto/update-actividad-tecnica.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';

@Auth(Role.ADMIN)
@Controller('actividad-tecnica')
export class ActividadTecnicaController {
  constructor(private readonly actividadTecnicaService: ActividadTecnicaService) {}

  @Auth(Role.TECH)
  @Post()
  async create(@Body() createDto: CreateActividadTecnicaDto) {
    // Validaciones opcionales aquí
    if (!createDto.ordenId || !createDto.tipoActividadId) {
      throw new BadRequestException('ordenId y tipoActividadId son obligatorios.');
    }
    return this.actividadTecnicaService.create(createDto);
  }

  @Auth(Role.TECH)
  @Get()
  async findAll() {
    return this.actividadTecnicaService.findAll();
  }

  @Auth(Role.TECH)
  @Get(':id')
  async findOne(@Param('id') id: number) {
    if (isNaN(id)) throw new BadRequestException('ID inválido');
    return this.actividadTecnicaService.findOne(id);
  }

  @Auth(Role.TECH)
  @Patch(':id')
  async update(@Param('id') id: number, @Body() updateDto: UpdateActividadTecnicaDto) {
    if (isNaN(id)) throw new BadRequestException('ID inválido');
    return this.actividadTecnicaService.update(id, updateDto);
  }

  @Auth(Role.TECH)
  @Delete(':id')
  async remove(@Param('id') id: number) {
    if (isNaN(id)) throw new BadRequestException('ID inválido');
    return this.actividadTecnicaService.remove(id);
  }
}
