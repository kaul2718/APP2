import {  Controller, Get, Post, Body, Patch, Param, Delete,BadRequestException, NotFoundException,InternalServerErrorException,UsePipes,HttpCode, Put,} from '@nestjs/common';
import { TipoManoObraService } from './tipo-mano-obra.service';
import { CreateTipoManoObraDto } from './dto/create-tipo-mano-obra.dto';
import { UpdateTipoManoObraDto } from './dto/update-tipo-mano-obra.dto';
import { TipoManoObra } from './entities/tipo-mano-obra.entity';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';
import { TrimPipe } from 'src/common/pipes/trim.pipe';

@Auth(Role.ADMIN)
@Controller('tipo-mano-obra')
export class TipoManoObraController {
  constructor(private readonly tipoService: TipoManoObraService) {}

  @Post()
  @UsePipes(TrimPipe)
  async create(@Body() dto: CreateTipoManoObraDto): Promise<TipoManoObra> {
    try {
      return await this.tipoService.create(dto);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error al crear tipo de mano de obra: ${error.message}`,
      );
    }
  }

  @Get()
  async findAll(): Promise<TipoManoObra[]> {
    try {
      return await this.tipoService.findAll();
    } catch (error) {
      throw new InternalServerErrorException(
        `Error al obtener los tipos de mano de obra: ${error.message}`,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TipoManoObra> {
    if (!id) {
      throw new BadRequestException('El ID no puede estar vacío.');
    }

    const tipo = await this.tipoService.findOne(Number(id));
    if (!tipo) {
      throw new NotFoundException('No se encontró el tipo de mano de obra con ese ID.');
    }

    return tipo;
  }

  @Patch(':id')
  @UsePipes(TrimPipe)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTipoManoObraDto,
  ): Promise<TipoManoObra> {
    if (!id) {
      throw new BadRequestException('El ID no puede estar vacío.');
    }

    try {
      const tipo = await this.tipoService.findOne(Number(id));
      if (!tipo) {
        throw new NotFoundException('No se encontró el tipo de mano de obra con ese ID.');
      }

      return await this.tipoService.update(Number(id), dto);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error al actualizar el tipo de mano de obra: ${error.message}`,
      );
    }
  }

  @Delete(':id')
  @HttpCode(200)
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    const parsedId = parseInt(id, 10);

    if (isNaN(parsedId)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }

    try {
      await this.tipoService.remove(parsedId);
      return {
        message: `Tipo de mano de obra con ID ${id} eliminado (soft delete) exitosamente.`,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Error al eliminar el tipo de mano de obra: ${error.message}`,
      );
    }
  }

  // Nuevo endpoint para restaurar un soft deleted
  @Put('restore/:id')
  @HttpCode(200)
  async restore(@Param('id') id: string): Promise<TipoManoObra> {
    const parsedId = parseInt(id, 10);

    if (isNaN(parsedId)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }

    try {
      return await this.tipoService.restore(parsedId);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error al restaurar el tipo de mano de obra: ${error.message}`,
      );
    }
  }
}