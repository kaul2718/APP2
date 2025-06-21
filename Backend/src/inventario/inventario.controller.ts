import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, } from '@nestjs/common';
import { InventarioService } from './inventario.service';
import { CreateInventarioDto } from './dto/create-inventario.dto';
import { UpdateInventarioDto } from './dto/update-inventario.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';
import { Inventario } from './entities/inventario.entity';


@Auth(Role.ADMIN)
@Controller('inventarios')
export class InventarioController {
  constructor(private readonly service: InventarioService) { }

  @Post()
  create(@Body() dto: CreateInventarioDto): Promise<Inventario> {
    return this.service.create(dto);
  }

  @Get()
  findAll(): Promise<Inventario[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Inventario> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInventarioDto,
  ): Promise<Inventario> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.service.remove(id);
  }

  @Auth(Role.ADMIN)
  @Get('eliminados')
  findEliminados(): Promise<Inventario[]> {
    return this.service.findEliminados();
  }
  
  @Patch(':id/restaurar')
  restore(@Param('id', ParseIntPipe) id: number): Promise<Inventario> {
    return this.service.restore(id);
  }
}