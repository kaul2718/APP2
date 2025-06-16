import { Controller, Get, Post, Body, Param, Patch, Delete, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { RepuestosService } from './repuestos.service';
import { CreateRepuestoDto } from './dto/create-repuesto.dto';
import { UpdateRepuestoDto } from './dto/update-repuesto.dto';
import { Repuesto } from './entities/repuesto.entity';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';

@Auth(Role.ADMIN)
@Controller('repuestos')
export class RepuestosController {
  constructor(private readonly repuestosService: RepuestosService) {}

  // Crear un nuevo repuesto
  @Auth(Role.TECH) // Solo accesible por técnicos
  @Post()
  async create(@Body() createRepuestoDto: CreateRepuestoDto): Promise<Repuesto> {
    if (!createRepuestoDto.codigo || !createRepuestoDto.nombre) {
      throw new BadRequestException('El código y nombre son obligatorios.');
    }
    return this.repuestosService.create(createRepuestoDto);
  }

  // Obtener todos los repuestos
  @Auth(Role.TECH) // Solo accesible por técnicos
  @Get()
  async findAll(): Promise<Repuesto[]> {
    return this.repuestosService.findAll();
  }

  // Obtener un repuesto por ID
  @Auth(Role.TECH) // Solo accesible por técnicos
  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Repuesto> {
    if (isNaN(id)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }
    try {
      return await this.repuestosService.findOne(id);
    } catch (error) {
      throw new NotFoundException(`Repuesto con ID ${id} no encontrado.`);
    }
  }

  // Actualizar un repuesto
  @Auth(Role.TECH) // Solo accesible por técnicos
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updateRepuestoDto: UpdateRepuestoDto,
  ): Promise<Repuesto> {
    if (isNaN(id)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }
    if (!updateRepuestoDto.codigo || !updateRepuestoDto.nombre) {
      throw new BadRequestException('El código y nombre son obligatorios para la actualización.');
    }

    try {
      // Verificar si el repuesto existe
      const existingRepuesto = await this.repuestosService.findOne(id);
      if (!existingRepuesto) {
        throw new NotFoundException(`No se ha encontrado un repuesto con ID ${id}.`);
      }

      // Actualizar el repuesto con el DTO proporcionado
      return await this.repuestosService.update(id, updateRepuestoDto);
    } catch (error) {
      throw new InternalServerErrorException(
        `Ocurrió un error al intentar actualizar el repuesto: ${error.message}`,
      );
    }
  }

  // Eliminar un repuesto
  @Auth(Role.TECH) // Solo accesible por técnicos
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<{ message: string }> {
    if (isNaN(id)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }

    try {
      await this.repuestosService.remove(id);
      return { message: `Repuesto con ID ${id} eliminado con éxito.` };
    } catch (error) {
      throw new InternalServerErrorException(
        `Ocurrió un error al intentar eliminar el repuesto: ${error.message}`,
      );
    }
  }
}

