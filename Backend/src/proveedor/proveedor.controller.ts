import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { ProveedorService } from './proveedor.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { Proveedor } from './entities/proveedor.entity';

@Auth('admin', 'recep') // Permitir a Admin y Receptor (personal de recepción/bodega)
@Controller('proveedor')
export class ProveedorController {
  constructor(private readonly proveedorService: ProveedorService) {}

  @Post()
  create(@Body() createProveedorDto: CreateProveedorDto): Promise<Proveedor> {
    return this.proveedorService.create(createProveedorDto);
  }

  @Get()
  findAll(
    @Query('limit') limit?: number,
    @Query('page') page?: number,
    @Query('search') search?: string,
  ): Promise<{ items: Proveedor[]; total: number }> {
    return this.proveedorService.findAll({
      limit: limit ? Number(limit) : undefined,
      page: page ? Number(page) : undefined,
      search,
    });
  }

  @Get('active')
  findActive(): Promise<Proveedor[]> {
    return this.proveedorService.findActive();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Proveedor> {
    return this.proveedorService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProveedorDto: UpdateProveedorDto,
  ): Promise<Proveedor> {
    return this.proveedorService.update(id, updateProveedorDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.proveedorService.remove(id);
  }
}
