import {Controller,Get,Post,Body,Patch,Param,Delete,} from '@nestjs/common';
import { TipoEspecificacionService } from './tipo-especificacion.service';
import { CreateTipoEspecificacionDto } from './dto/create-tipo-especificacion.dto';
import { UpdateTipoEspecificacionDto } from './dto/update-tipo-especificacion.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';

@Controller('tipo-especificacion')
export class TipoEspecificacionController {
  constructor(private readonly service: TipoEspecificacionService) { }

  // Solo el ADMIN puede crear tipos
  @Post()
  @Auth(Role.ADMIN)
  create(@Body() dto: CreateTipoEspecificacionDto) {
    return this.service.create(dto);
  }

  // Todos los autenticados pueden ver los tipos
  @Get()
  @Auth()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Auth()
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  // Solo el ADMIN puede actualizar
  @Patch(':id')
  @Auth(Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTipoEspecificacionDto,
  ) {
    return this.service.update(+id, dto);
  }

  // Solo el ADMIN puede eliminar
  @Delete(':id')
  @Auth(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
