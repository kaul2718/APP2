import {Controller,Post,Get,Param,Body, ParseIntPipe,UseGuards,} from '@nestjs/common';
import { HistorialEstadoOrdenService } from './historial-estado-orden.service';
import { CreateHistorialEstadoOrdenDto } from './dto/create-historial-estado-orden.dto';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';

@Controller('historial-estado-orden')
@UseGuards(AuthGuard, RolesGuard)
export class HistorialEstadoOrdenController {
  constructor(private readonly service: HistorialEstadoOrdenService) {}

  @Post()
  @Auth(Role.ADMIN, Role.TECH)
  create(@Body() dto: CreateHistorialEstadoOrdenDto) {
    return this.service.create(dto);
  }

  @Get()
  @Auth(Role.ADMIN, Role.TECH)
  findAll() {
    return this.service.findAll();
  }

  @Get('orden/:ordenId')
  @Auth(Role.ADMIN, Role.TECH)
  findByOrden(@Param('ordenId', ParseIntPipe) ordenId: number) {
    return this.service.findByOrden(ordenId);
  }
}
