import { Controller, Get, Post, Body, Patch, Param, Delete, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { CasilleroService } from './casillero.service';
import { CreateCasilleroDto } from './dto/create-casillero.dto';
import { UpdateCasilleroDto } from './dto/update-casillero.dto';
import { Casillero } from './entities/casillero.entity';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';


@Auth(Role.ADMIN)
@Controller('casilleros')
export class CasilleroController {
  constructor(private readonly casilleroService: CasilleroService) {}

  // Crear un nuevo casillero
  @Post()
  async create(@Body() createCasilleroDto: CreateCasilleroDto): Promise<Casillero> {
    return this.casilleroService.create(createCasilleroDto);
  }

  // Obtener todos los casilleros
  @Auth(Role.TECH)
  @Get()
  async findAll(): Promise<Casillero[]> {
    return this.casilleroService.findAll();
  }

  // Obtener un casillero por su número
  @Auth(Role.TECH)
  @Get(':numero')
  async findOne(@Param('numero') numero: string): Promise<Casillero> {
    if (!numero) {
      throw new BadRequestException('El número de casillero no puede estar vacío.');
    }
    return this.casilleroService.findOneByNumero(numero);
  }

  // Actualizar un casillero por su número
  @Auth(Role.TECH)
  @Patch(':numero')
  async update(
    @Param('numero') numero: string,
    @Body() updateCasilleroDto: UpdateCasilleroDto
  ): Promise<Casillero> {
    if (!numero) {
      throw new BadRequestException('El número de casillero no puede estar vacío.');
    }
    try {
      const existingCasillero = await this.casilleroService.findOneByNumero(numero);
      if (!existingCasillero) {
        throw new NotFoundException('No se ha encontrado un casillero con ese número.');
      }
      return await this.casilleroService.update(numero, updateCasilleroDto);
    } catch (error) {
      throw new InternalServerErrorException(`Error al actualizar el casillero: ${error.message}`);
    }
  }

  // Eliminar un casillero por su número
  @Auth(Role.TECH)
  @Delete(':numero')
  async remove(@Param('numero') numero: string): Promise<void> {
    if (!numero) {
      throw new BadRequestException('El número de casillero no puede estar vacío.');
    }
    await this.casilleroService.remove(numero);
  }
}