import { Controller, Get, Param, Post, Body, Patch, Delete, BadRequestException, NotFoundException } from '@nestjs/common';
import { DetalleServiciosService } from './detalle-servicios.service';
import { CreateDetalleServicioDto } from './dto/create-detalle-servicio.dto';
import { UpdateDetalleServicioDto } from './dto/update-detalle-servicio.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';

@Auth(Role.ADMIN)
@Controller('detalle-servicios')
export class DetalleServiciosController {
  constructor(private readonly detalleServiciosService: DetalleServiciosService) {}

  // Crear un nuevo detalle de servicio
  @Auth(Role.TECH) // Solo accesible por técnicos
  @Post()
  async create(@Body() createDetalleServicioDto: CreateDetalleServicioDto) {
    return this.detalleServiciosService.create(createDetalleServicioDto);
  }

  // Obtener todos los detalles de servicio
  @Auth(Role.TECH) // Solo accesible por técnicos
  @Get()
  async findAll() {
    return this.detalleServiciosService.findAll();
  }

  // Obtener un detalle de servicio por ID
  @Auth(Role.TECH) // Solo accesible por técnicos
  @Get(':id')
  async findOne(@Param('id') id: number) {
    if (isNaN(id)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }
    return this.detalleServiciosService.findOne(id);
  }

  // Actualizar un detalle de servicio
  @Auth(Role.TECH) // Solo accesible por técnicos
  @Patch(':id')
  async update(@Param('id') id: number, @Body() updateDetalleServicioDto: UpdateDetalleServicioDto) {
    if (isNaN(id)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }
    return this.detalleServiciosService.update(id, updateDetalleServicioDto);
  }

  // Eliminar un detalle de servicio
  @Auth(Role.TECH) // Solo accesible por técnicos
  @Delete(':id')
  async remove(@Param('id') id: number) {
    if (isNaN(id)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }
    return this.detalleServiciosService.remove(id);
  }
}
