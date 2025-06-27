import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { EstadoOrdenService } from './estado-orden.service';
import { CreateEstadoOrdenDto } from './dto/create-estado-orden.dto';
import { UpdateEstadoOrdenDto } from './dto/update-estado-orden.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { AuthGuard } from 'src/auth/guard/auth.guard';

@UseGuards(AuthGuard, RolesGuard)
@Controller('estado-orden')
export class EstadoOrdenController {
  constructor(private readonly estadoOrdenService: EstadoOrdenService) {}

  // Solo ADMIN puede crear un estado nuevo
  @Auth(Role.ADMIN)
  @Post()
  create(@Body() createDto: CreateEstadoOrdenDto) {
    return this.estadoOrdenService.create(createDto);
  }

  // ADMIN y TECNICO pueden ver todos los estados
  @Auth(Role.ADMIN, Role.TECH)
  @Get()
  findAll() {
    return this.estadoOrdenService.findAll();
  }

  // ADMIN y TECNICO pueden ver un estado por ID
  @Auth(Role.ADMIN, Role.TECH)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.estadoOrdenService.findOne(id);
  }

  // Solo ADMIN puede actualizar
  @Auth(Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateEstadoOrdenDto,
  ) {
    return this.estadoOrdenService.update(id, updateDto);
  }

  // Solo ADMIN puede eliminar (soft delete)
  @Auth(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.estadoOrdenService.remove(id);
  }
}
