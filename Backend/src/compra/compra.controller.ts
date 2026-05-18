import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, Patch } from '@nestjs/common';
import { CompraService } from './compra.service';
import { CreateCompraDto } from './dto/create-compra.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { ActiveUser } from '../common/decorators/active-user.decorator';
import { Compra } from './entities/compra.entity';

@Auth('admin', 'recep') // Protegido solo para Administradores y Recepcionistas/Recepción
@Controller('compra')
export class CompraController {
  constructor(private readonly compraService: CompraService) {}

  @Post()
  create(
    @Body() createCompraDto: CreateCompraDto,
    @ActiveUser() user: any,
  ): Promise<Compra> {
    return this.compraService.create(createCompraDto, user.id);
  }

  @Get()
  findAll(
    @Query('limit') limit?: number,
    @Query('page') page?: number,
    @Query('search') search?: string,
  ): Promise<{ items: Compra[]; total: number }> {
    return this.compraService.findAll({
      limit: limit ? Number(limit) : undefined,
      page: page ? Number(page) : undefined,
      search,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Compra> {
    return this.compraService.findOne(id);
  }

  @Patch(':id/anular')
  anulacion(@Param('id', ParseIntPipe) id: number): Promise<Compra> {
    return this.compraService.anulacion(id);
  }
}
