import { Controller, Get, Post, Body, Patch, Param, Delete, InternalServerErrorException, BadRequestException, NotFoundException, UsePipes, HttpCode } from '@nestjs/common';
import { DetalleManoObraService } from './detalle-mano-obra.service';
import { CreateDetalleManoObraDto } from './dto/create-detalle-mano-obra.dto';
import { UpdateDetalleManoObraDto } from './dto/update-detalle-mano-obra.dto';
import { TrimPipe } from 'src/common/pipes/trim.pipe';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';
import { DetalleManoObra } from './entities/detalle-mano-obra.entity';

@Auth(Role.ADMIN, Role.TECH)
@Controller('detalle-mano-obra')
export class DetalleManoObraController {
  constructor(private readonly detalleService: DetalleManoObraService) {}

  @Post()
  @UsePipes(TrimPipe)
  async create(@Body() dto: CreateDetalleManoObraDto): Promise<DetalleManoObra> {
    try {
      return await this.detalleService.create(dto);
    } catch (error) {
      throw new InternalServerErrorException(`Error al crear detalle de mano de obra: ${error.message}`);
    }
  }

  @Get()
  async findAll(): Promise<DetalleManoObra[]> {
    try {
      return await this.detalleService.findAll();
    } catch (error) {
      throw new InternalServerErrorException(`Error al obtener detalles: ${error.message}`);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<DetalleManoObra> {
    const parsedId = Number(id);
    if (isNaN(parsedId)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }

    try {
      return await this.detalleService.findOne(parsedId);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Patch(':id')
  @UsePipes(TrimPipe)
  async update(@Param('id') id: string, @Body() dto: UpdateDetalleManoObraDto): Promise<DetalleManoObra> {
    const parsedId = Number(id);
    if (isNaN(parsedId)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }

    try {
      return await this.detalleService.update(parsedId, dto);
    } catch (error) {
      throw new InternalServerErrorException(`Error al actualizar detalle: ${error.message}`);
    }
  }

  @Delete(':id')
  @HttpCode(200)
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    const parsedId = Number(id);
    if (isNaN(parsedId)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }

    try {
      return await this.detalleService.remove(parsedId);
    } catch (error) {
      throw new InternalServerErrorException(`Error al eliminar detalle: ${error.message}`);
    }
  }
}