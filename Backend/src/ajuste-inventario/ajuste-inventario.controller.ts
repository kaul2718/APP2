import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { AjusteInventarioService } from './ajuste-inventario.service';
import { CreateAjusteInventarioDto } from './dto/create-ajuste-inventario.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { ActiveUser } from '../common/decorators/active-user.decorator';
import { UserActiveInterface } from '../common/interfaces/user-active.interface';
import { AjusteInventario } from './entities/ajuste-inventario.entity';

@Auth('admin') // Protegido solo para Administradores
@Controller('ajuste-inventario')
export class AjusteInventarioController {
  constructor(private readonly ajusteInventarioService: AjusteInventarioService) {}

  @Post()
  create(
    @Body() createDto: CreateAjusteInventarioDto,
    @ActiveUser() user: any,
  ): Promise<AjusteInventario> {
    return this.ajusteInventarioService.create(createDto, user.id);
  }

  @Get()
  findAll(): Promise<AjusteInventario[]> {
    return this.ajusteInventarioService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<AjusteInventario> {
    return this.ajusteInventarioService.findOne(id);
  }
}
