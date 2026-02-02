import { Controller, Post, Get, Param, Body, ParseIntPipe, UseGuards, } from '@nestjs/common';
import { HistorialEstadoOrdenService } from './historial-estado-orden.service';
import { CreateHistorialEstadoOrdenDto } from './dto/create-historial-estado-orden.dto';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Auth } from 'src/auth/decorators/auth.decorator';


@Auth('tech', 'admin', 'recep', 'client')
@Controller('historial-estado-orden')
@UseGuards(AuthGuard, RolesGuard)
export class HistorialEstadoOrdenController {
  constructor(private readonly service: HistorialEstadoOrdenService) { }

  @Post()
  @Auth('admin', 'tech')
  create(@Body() dto: CreateHistorialEstadoOrdenDto) {
    return this.service.create(dto);
  }

  @Get()
  @Auth('admin', 'tech')
  findAll() {
    return this.service.findAll();
  }

  @Get('orden/:ordenId')
  @Auth('admin', 'tech')
  findByOrden(@Param('ordenId', ParseIntPipe) ordenId: number) {
    return this.service.findByOrden(ordenId);
  }
}
