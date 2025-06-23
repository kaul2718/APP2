import {Controller, Get,Post,Patch,Delete,Param,Body,BadRequestException,NotFoundException,InternalServerErrorException,ParseIntPipe,} from '@nestjs/common';
import { EvidenciaTecnicaService } from './evidencia-tecnica.service';
import { CreateEvidenciaTecnicaDto } from './dto/create-evidencia-tecnica.dto';
import { UpdateEvidenciaTecnicaDto } from './dto/update-evidencia-tecnica.dto';
import { EvidenciaTecnica } from './entities/evidencia-tecnica.entity';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';

@Auth(Role.ADMIN)
@Controller('evidencias-tecnicas')
export class EvidenciaTecnicaController {
  constructor(private readonly evidenciaService: EvidenciaTecnicaService) {}

  @Auth(Role.TECH, Role.ADMIN)
  @Post()
  async create(
    @Body() createDto: CreateEvidenciaTecnicaDto,
  ): Promise<EvidenciaTecnica> {
    if (!createDto.ordenId || !createDto.urlImagen || !createDto.subidoPorId) {
      throw new BadRequestException(
        'ordenId, urlImagen y subidoPorId son obligatorios.',
      );
    }
    return await this.evidenciaService.create(createDto);
  }

  @Auth(Role.TECH, Role.ADMIN)
  @Get()
  async findAll(): Promise<EvidenciaTecnica[]> {
    return await this.evidenciaService.findAll();
  }

  @Auth(Role.TECH, Role.ADMIN)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<EvidenciaTecnica> {
    return await this.evidenciaService.findOne(id);
  }

  @Auth(Role.TECH, Role.ADMIN)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateEvidenciaTecnicaDto,
  ): Promise<EvidenciaTecnica> {
    return await this.evidenciaService.update(id, updateDto);
  }

  @Auth(Role.TECH, Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return await this.evidenciaService.remove(id);
  }
}
