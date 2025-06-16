import { Controller, Get, Post, Body, Param, Patch, Delete, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ServiciosService } from './servicios.service';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';
import { Servicio } from './entities/servicio.entity';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';

@Auth(Role.ADMIN)
@Controller('servicios')
export class ServiciosController {
  constructor(private readonly serviciosService: ServiciosService) {}

  @Auth(Role.TECH)
  @Post()
  async create(@Body() createServicioDto: CreateServicioDto): Promise<Servicio> {
    if (!createServicioDto.nombre || !createServicioDto.descripcion) {
      throw new BadRequestException('El nombre y descripción son obligatorios.');
    }
    return this.serviciosService.create(createServicioDto);
  }

  @Auth(Role.TECH)
  @Get()
  async findAll(): Promise<Servicio[]> {
    return this.serviciosService.findAll();
  }

  @Auth(Role.TECH)
  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Servicio> {
    if (isNaN(id)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }
    try {
      return await this.serviciosService.findOne(id);
    } catch (error) {
      throw new NotFoundException(`Servicio con ID ${id} no encontrado.`);
    }
  }

  @Auth(Role.TECH)
  @Patch(':id')
  async update(@Param('id') id: number, @Body() updateServicioDto: UpdateServicioDto): Promise<Servicio> {
    if (isNaN(id)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }
    try {
      return await this.serviciosService.update(id, updateServicioDto);
    } catch (error) {
      throw new InternalServerErrorException(`Error al actualizar el servicio: ${error.message}`);
    }
  }

  @Auth(Role.TECH)
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<{ message: string }> {
    if (isNaN(id)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }
    try {
      await this.serviciosService.remove(id);
      return { message: `Servicio con ID ${id} eliminado con éxito.` };
    } catch (error) {
      throw new InternalServerErrorException(`Error al eliminar el servicio: ${error.message}`);
    }
  }
}