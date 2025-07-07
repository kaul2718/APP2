import { Controller, Get, Post, Patch, Delete, Param, Body, BadRequestException, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { PresupuestoService } from './presupuesto.service';
import { CreatePresupuestoDto } from './dto/create-presupuesto.dto';
import { UpdatePresupuestoDto } from './dto/update-presupuesto.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';

@Auth(Role.ADMIN)
@Controller('presupuestos')
export class PresupuestoController {
  constructor(private readonly presupuestoService: PresupuestoService) { }

  @Auth(Role.TECH)
  @Post()
  async crearPresupuesto(@Body() createDto: CreatePresupuestoDto) {
    try {
      return await this.presupuestoService.create(createDto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Auth(Role.TECH)
  @Get()
  async obtenerTodos() {
    try {
      return await this.presupuestoService.findAll();
    } catch (error) {
      throw new BadRequestException('Error al obtener los presupuestos');
    }
  }

  @Auth(Role.TECH)
  @Get(':id')
  async obtenerUno(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.presupuestoService.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Error al obtener el presupuesto');
    }
  }

  @Auth(Role.TECH)
  @Patch(':id')
  async actualizarPresupuesto(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePresupuestoDto
  ) {
    try {
      return await this.presupuestoService.update(id, updateDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Error al actualizar el presupuesto');
    }
  }

  @Auth(Role.TECH)
  @Delete(':id')
  async eliminarPresupuesto(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.presupuestoService.remove(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Error al eliminar el presupuesto');
    }
  }

  @Auth(Role.TECH)
  @Get(':id/resumen')
  async obtenerResumen(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.presupuestoService.getResumenPresupuesto(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Error al generar el resumen del presupuesto');
    }
  }
}