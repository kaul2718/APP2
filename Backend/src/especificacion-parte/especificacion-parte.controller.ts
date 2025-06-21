import {Controller,Get,Post,Body,Patch,Param,Delete,ParseIntPipe,} from '@nestjs/common';
import { EspecificacionParteService } from './especificacion-parte.service';
import { CreateEspecificacionParteDto } from './dto/create-especificacion-parte.dto';
import { UpdateEspecificacionParteDto } from './dto/update-especificacion-parte.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';

@Auth(Role.ADMIN)
@Controller('especificaciones-parte')
export class EspecificacionParteController {
  constructor(private readonly service: EspecificacionParteService) {}

  @Post()
  create(@Body() dto: CreateEspecificacionParteDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEspecificacionParteDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Patch(':id/restore')
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.service.restore(id);
  }
}
