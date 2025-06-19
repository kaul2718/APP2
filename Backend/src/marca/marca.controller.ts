import { Controller, Post, Body, Get, Param, Patch, Delete } from '@nestjs/common';
import { MarcaService } from './marca.service';
import { CreateMarcaDto } from './dto/create-marca.dto';
import { UpdateMarcaDto } from './dto/update-marca.dto';
import { Marca } from './entities/marca.entity';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';

@Auth(Role.ADMIN)
@Controller('marcas')
export class MarcaController {
  constructor(private readonly marcaService: MarcaService) {}

  @Post()
  create(@Body() dto: CreateMarcaDto): Promise<Marca> {
    return this.marcaService.create(dto);
  }

  @Get()
  findAll(): Promise<Marca[]> {
    return this.marcaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Marca> {
    return this.marcaService.findOne(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMarcaDto): Promise<Marca> {
    return this.marcaService.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.marcaService.remove(Number(id));
  }
}
