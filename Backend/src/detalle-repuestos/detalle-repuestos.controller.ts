import { Controller, Get, Param, Post, Body, Patch, Delete, BadRequestException } from '@nestjs/common';
import { DetalleRepuestosService } from './detalle-repuestos.service';
import { CreateDetalleRepuestoDto } from './dto/create-detalle-repuesto.dto';
import { UpdateDetalleRepuestoDto } from './dto/update-detalle-repuesto.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';

@Auth(Role.ADMIN)
@Controller('detalle-repuestos')
export class DetalleRepuestosController {
  constructor(private readonly detalleRepuestosService: DetalleRepuestosService) {}

  @Auth(Role.TECH)
  @Post()
  async create(@Body() createDetalleRepuestoDto: CreateDetalleRepuestoDto) {
    return this.detalleRepuestosService.create(createDetalleRepuestoDto);
  }

  @Auth(Role.TECH)
  @Get()
  async findAll() {
    return this.detalleRepuestosService.findAll();
  }

  @Auth(Role.TECH)
  @Get(':id')
  async findOne(@Param('id') id: number) {
    if (isNaN(id)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }
    return this.detalleRepuestosService.findOne(id);
  }

  @Auth(Role.TECH)
  @Patch(':id')
  async update(@Param('id') id: number, @Body() updateDetalleRepuestoDto: UpdateDetalleRepuestoDto) {
    if (isNaN(id)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }
    return this.detalleRepuestosService.update(id, updateDetalleRepuestoDto);
  }

  @Auth(Role.TECH)
  @Delete(':id')
  async remove(@Param('id') id: number) {
    if (isNaN(id)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }
    return this.detalleRepuestosService.remove(id);
  }
}
