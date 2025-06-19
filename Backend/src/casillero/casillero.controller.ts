import {Controller,Get,Post,Body,Patch,Param,Delete,BadRequestException,} from '@nestjs/common';
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
  async create(
    @Body() createCasilleroDto: CreateCasilleroDto,
  ): Promise<Casillero> {
    return this.casilleroService.create(createCasilleroDto);
  }

  // Obtener todos los casilleros (no eliminados)
  @Auth(Role.TECH)
  @Get()
  async findAll(): Promise<Casillero[]> {
    return this.casilleroService.findAll();
  }

  // Obtener casilleros disponibles
  @Auth(Role.TECH)
  @Get('disponibles')
  async findDisponibles(): Promise<Casillero[]> {
    return this.casilleroService.findDisponibles();
  }

  // Obtener un casillero por su número
  @Auth(Role.TECH)
  @Get(':numero')
  async findOne(@Param('numero') numero: string): Promise<Casillero> {
    return this.casilleroService.findOneByNumero(numero);
  }

  // Actualizar un casillero
  @Auth(Role.TECH)
  @Patch(':numero')
  async update(
    @Param('numero') numero: string,
    @Body() updateCasilleroDto: UpdateCasilleroDto,
  ): Promise<Casillero> {
    return this.casilleroService.update(numero, updateCasilleroDto);
  }

  // Liberar un casillero ocupado (dejar disponible)
  @Auth(Role.TECH)
  @Patch(':numero/liberar')
  async liberar(@Param('numero') numero: string): Promise<Casillero> {
    return this.casilleroService.liberarCasillero(numero);
  }

  // Eliminar (soft delete) un casillero
  @Auth(Role.ADMIN)
  @Delete(':numero')
  async remove(
    @Param('numero') numero: string,
  ): Promise<{ message: string }> {
    return this.casilleroService.remove(numero);
  }
}
