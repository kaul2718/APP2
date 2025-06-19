import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { ParteService } from './parte.service';
import { CreateParteDto } from './dto/create-parte.dto';
import { UpdateParteDto } from './dto/update-parte.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';

@Auth(Role.ADMIN)
@Controller('partes')
export class ParteController {
  constructor(private readonly parteService: ParteService) { }

  @Post()
  create(@Body() dto: CreateParteDto) {
    return this.parteService.create(dto);
  }

  @Get()
  findAll() {
    return this.parteService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.parteService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateParteDto,
  ) {
    return this.parteService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }

    await this.parteService.softDelete(parsedId);
    return { message: `La parte con ID ${parsedId} fue eliminada correctamente.` };
  }

}