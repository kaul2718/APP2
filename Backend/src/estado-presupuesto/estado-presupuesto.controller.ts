import {Controller,Get,Post,Body,Patch,Param,Delete,BadRequestException,NotFoundException,} from '@nestjs/common';
import { EstadoPresupuestoService } from './estado-presupuesto.service';
import { CreateEstadoPresupuestoDto } from './dto/create-estado-presupuesto.dto';
import { UpdateEstadoPresupuestoDto } from './dto/update-estado-presupuesto.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';

@Auth(Role.ADMIN) // Por defecto, todo el recurso solo accesible por ADMIN
@Controller('estado-presupuestos')
export class EstadoPresupuestoController {
  constructor(private readonly estadoPresupuestoService: EstadoPresupuestoService) {}

  // Crear un estado de presupuesto
  @Post()
  async create(@Body() dto: CreateEstadoPresupuestoDto) {
    return this.estadoPresupuestoService.create(dto);
  }

  // Listar todos los estados
  @Get()
  async findAll() {
    return this.estadoPresupuestoService.findAll();
  }

  // Obtener un estado por su ID
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }
    return this.estadoPresupuestoService.findOne(numericId);
  }

  // Actualizar un estado
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateEstadoPresupuestoDto) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }
    return this.estadoPresupuestoService.update(numericId, dto);
  }

  // Eliminar un estado
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }
    return this.estadoPresupuestoService.remove(numericId);
  }
}
