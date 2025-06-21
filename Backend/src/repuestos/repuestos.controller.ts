import {Controller,Get,Post,Body,Param,Patch,Delete,BadRequestException,NotFoundException,InternalServerErrorException,} from '@nestjs/common';
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
  @Auth(Role.TECH)
  @Post()
  async create(@Body() createRepuestoDto: CreateRepuestoDto): Promise<Repuesto> {
    if (!createRepuestoDto.codigo || !createRepuestoDto.nombre) {
      throw new BadRequestException('El código y nombre son obligatorios.');
    }

    return await this.repuestosService.create(createRepuestoDto);
  }

  // Obtener todos los repuestos no eliminados
  @Auth(Role.TECH)
  @Get()
  async findAll(): Promise<Repuesto[]> {
    return await this.repuestosService.findAll();
  }

  // Obtener un repuesto por ID
  @Auth(Role.TECH)
  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Repuesto> {
    if (isNaN(id)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }

    return await this.repuestosService.findOne(id);
  }

  // Actualizar un repuesto
  @Auth(Role.TECH)
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updateRepuestoDto: UpdateRepuestoDto,
  ): Promise<Repuesto> {
    if (isNaN(id)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }

    return await this.repuestosService.update(id, updateRepuestoDto);
  }

  // Eliminar un repuesto (borrado lógico)
  @Auth(Role.TECH)
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<{ message: string }> {
    if (isNaN(id)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }

    return await this.repuestosService.remove(id);
  }
}
