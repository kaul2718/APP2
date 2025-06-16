import { Controller, Get, Param, Post, Body, Patch, Delete, BadRequestException, NotFoundException } from '@nestjs/common';
import { DetalleRepuestosService } from './detalle-repuestos.service';
import { CreateDetalleRepuestoDto } from './dto/create-detalle-repuesto.dto';
import { UpdateDetalleRepuestoDto } from './dto/update-detalle-repuesto.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';


@Auth(Role.ADMIN)
@Controller('detalle-repuestos')
export class DetalleRepuestosController {
  constructor(private readonly detalleRepuestosService: DetalleRepuestosService) {}

  // Crear un nuevo detalle de repuesto
  @Auth(Role.TECH) // Solo accesible por técnicos
  @Post()
  async create(@Body() createDetalleRepuestoDto: CreateDetalleRepuestoDto) {
    return this.detalleRepuestosService.create(createDetalleRepuestoDto);
  }

  // Obtener todos los detalles de repuestos
  @Auth(Role.TECH) // Solo accesible por técnicos
  @Get()
  async findAll() {
    return this.detalleRepuestosService.findAll();
  }

  // Obtener un detalle de repuesto por ID
  @Auth(Role.TECH) // Solo accesible por técnicos
  @Get(':id')
  async findOne(@Param('id') id: number) {
    if (isNaN(id)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }
    return this.detalleRepuestosService.findOne(id);
  }

  // Actualizar un detalle de repuesto
  @Auth(Role.TECH) // Solo accesible por técnicos
  @Patch(':id')
  async update(@Param('id') id: number, @Body() updateDetalleRepuestoDto: UpdateDetalleRepuestoDto) {
    if (isNaN(id)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }
    return this.detalleRepuestosService.update(id, updateDetalleRepuestoDto);
  }

  // Eliminar un detalle de repuesto
  @Auth(Role.TECH) // Solo accesible por técnicos
  @Delete(':id')
  async remove(@Param('id') id: number) {
    if (isNaN(id)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }
    return this.detalleRepuestosService.remove(id);
  }
}
