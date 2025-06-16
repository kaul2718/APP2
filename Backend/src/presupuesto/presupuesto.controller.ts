import { Controller, Get, Param, Patch, BadRequestException, NotFoundException, InternalServerErrorException, Post, Body } from '@nestjs/common';
import { PresupuestoService } from './presupuesto.service';
import { Presupuesto } from './entities/presupuesto.entity';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';
import { CreatePresupuestoDto } from './dto/create-presupuesto.dto';

@Auth(Role.ADMIN)
@Controller('presupuestos')
export class PresupuestoController {
  constructor(private readonly presupuestoService: PresupuestoService) {}

  @Auth(Role.TECH)
  @Post()
  async create(@Body() createPresupuestoDto: CreatePresupuestoDto): Promise<Presupuesto> {
    if (!createPresupuestoDto.orderId) {
      throw new BadRequestException('El orderId es obligatorio.');
    }
    try {
      return await this.presupuestoService.create(createPresupuestoDto);
    } catch (error) {
      throw new InternalServerErrorException(`Error al crear el presupuesto: ${error.message}`);
    }
  }
  // Ruta para obtener un presupuesto por ID
  @Get(':id')
  async getPresupuesto(@Param('id') id: number): Promise<Presupuesto> {
    if (isNaN(id)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }
    try {
      return await this.presupuestoService.getPresupuesto(id);
    } catch (error) {
      throw new NotFoundException(`Presupuesto con ID ${id} no encontrado.`);
    }
  }

  // Ruta para aceptar un presupuesto
  @Patch(':id/aceptar')
  async aceptarPresupuesto(@Param('id') id: number): Promise<Presupuesto> {
    try {
      return await this.presupuestoService.aceptarPresupuesto(id);
    } catch (error) {
      throw new InternalServerErrorException(`Error al aceptar el presupuesto: ${error.message}`);
    }
  }

  // Ruta para rechazar un presupuesto
  @Patch(':id/rechazar')
  async rechazarPresupuesto(@Param('id') id: number): Promise<Presupuesto> {
    try {
      return await this.presupuestoService.rechazarPresupuesto(id);
    } catch (error) {
      throw new InternalServerErrorException(`Error al rechazar el presupuesto: ${error.message}`);
    }
  }
}
