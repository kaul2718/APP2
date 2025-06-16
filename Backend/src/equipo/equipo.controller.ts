import { Controller, Get, Post, Body, Patch, Param, Delete, BadRequestException, NotFoundException, InternalServerErrorException, UsePipes, HttpCode } from '@nestjs/common';
import { EquipoService } from './equipo.service';  // Asegúrate de importar el servicio correspondiente
import { CreateEquipoDto } from './dto/create-equipo.dto';  // DTO para crear equipo
import { UpdateEquipoDto } from './dto/update-equipo.dto';  // DTO para actualizar equipo
import { Equipo } from './entities/equipo.entity';  // Entidad del equipo
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';
import { IsNotBlank } from 'src/decorators/is-not-blank-decorator';
import { TrimPipe } from 'src/common/pipes/trim.pipe';

@Auth(Role.ADMIN)  // Asegurando que el acceso sea para administradores
@Controller('equipos')  // Ruta base para equipos
export class EquipoController {
  constructor(private readonly equipoService: EquipoService) { }

  // Crear un nuevo equipo
  @Auth(Role.ADMIN)  // Solo accesible por ADMIN
  @Post()
  async create(@Body() createEquipoDto: CreateEquipoDto): Promise<Equipo> {
    return this.equipoService.create(createEquipoDto);
  }

  // Obtener todos los equipos
  @Auth(Role.ADMIN)  // Solo accesible por ADMIN
  @Get()
  async findAll(): Promise<Equipo[]> {
    return this.equipoService.findAll();
  }

  // Obtener un equipo por su ID
  @Auth(Role.ADMIN)  // Solo accesible por ADMIN
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Equipo> {
    if (!id) {
      throw new BadRequestException('El ID del equipo no puede estar vacío.');
    }

    const equipo = await this.equipoService.findOne(Number(id));
    if (!equipo) {
      throw new NotFoundException('No se ha encontrado un equipo con ese ID.');
    }
    return equipo;
  }

  // Actualizar un equipo por su ID
  @Auth(Role.ADMIN)  // Solo accesible por ADMIN
  @Patch(':id')
  @UsePipes(TrimPipe) // Usas el Pipe aquí
  async update(
    @Param('id') id: string,
    @Body() updateEquipoDto: UpdateEquipoDto,
  ): Promise<Equipo> {
    if (!id) {
      throw new BadRequestException('El ID del equipo no puede estar vacío.');
    }

    try {
      const existingEquipo = await this.equipoService.findOne(Number(id));
      if (!existingEquipo) {
        throw new NotFoundException('No se ha encontrado un equipo con ese ID.');
      }

      return this.equipoService.update(Number(id), updateEquipoDto);
    } catch (error) {
      throw new InternalServerErrorException(
        `Ocurrió un error al intentar actualizar el equipo: ${error.message}`,
      );
    }
  }

  // Eliminar un equipo
  @Auth(Role.ADMIN)  // Solo accesible por ADMIN
  @Delete(':id')
  @HttpCode(200)  // Aseguramos un código 200 para indicar éxito
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    const parsedId = parseInt(id, 10);

    // Verificar que el ID es un número válido
    if (isNaN(parsedId)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }

    try {
      await this.equipoService.remove(parsedId);
      return { message: `Equipo con ID ${id} eliminado exitosamente.` };
    } catch (error) {
      throw new InternalServerErrorException(
        `Ocurrió un error al intentar eliminar el equipo: ${error.message}`,
      );
    }
  }
}
