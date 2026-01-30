import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  BadRequestException,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EvidenciaTecnicaService } from './evidencia-tecnica.service';
import { CreateEvidenciaTecnicaDto } from './dto/create-evidencia-tecnica.dto';
import { UpdateEvidenciaTecnicaDto } from './dto/update-evidencia-tecnica.dto';
import { EvidenciaTecnica } from './entities/evidencia-tecnica.entity';
import { Auth } from '../auth/decorators/auth.decorator';
import { Role } from '../common/enums/rol.enum';

@Auth(Role.ADMIN, Role.TECH, Role.RECEP) // Ajusta los roles según necesites
@Controller('evidencias-tecnicas')
export class EvidenciaTecnicaController {
  constructor(private readonly evidenciaService: EvidenciaTecnicaService) { }
  @Auth(Role.TECH, Role.ADMIN, Role.RECEP)
  @Post()
  @UseInterceptors(FileInterceptor('archivo'))
  async create(
    @Body() createDto: any, // Usamos any porque no se puede validar automáticamente con multipart/form-data
    @UploadedFile() archivo?: Express.Multer.File,
  ): Promise<{ success: boolean; data: EvidenciaTecnica; message: string }> {

    // Convertir los campos que vienen como strings a números
    createDto.ordenId = Number(createDto.ordenId);
    createDto.subidoPorId = Number(createDto.subidoPorId);

    // Validar que sean números válidos
    if (!createDto.ordenId || isNaN(createDto.ordenId) || !createDto.subidoPorId || isNaN(createDto.subidoPorId)) {
      throw new BadRequestException('ordenId y subidoPorId deben ser números válidos y obligatorios.');
    }

    if (!archivo && !createDto.archivoUrl) {
      throw new BadRequestException('Debe proporcionar un archivo o una URL');
    }

    if (archivo) {
      createDto.archivoUrl = `data:${archivo.mimetype};base64,${archivo.buffer.toString('base64')}`;
      createDto.tipoArchivo = archivo.mimetype.startsWith('image') ? 'imagen' : 'video';
    }

    const evidenciaCreada = await this.evidenciaService.create(createDto);

    return {
      success: true,
      data: evidenciaCreada,
      message: 'Evidencia creada exitosamente',
    };
  }


  @Auth(Role.TECH, Role.ADMIN, Role.RECEP, Role.CLIENT)
  @Get()
  async findAll(
    @Query('ordenId') ordenId?: number,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10
  ): Promise<{
    success: boolean;
    data: EvidenciaTecnica[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    message?: string;
  }> {
    // Validación de parámetros
    if (page < 1) throw new BadRequestException('La página debe ser mayor o igual a 1');
    if (limit < 1 || limit > 100) throw new BadRequestException('El límite debe estar entre 1 y 100');

    const result = await this.evidenciaService.findAll(ordenId, page, limit);
    const totalPages = Math.ceil(result.total / limit);

    return {
      success: true,
      data: result.items,
      total: result.total,
      page: page,
      limit: limit,
      totalPages: totalPages,
      message: 'Evidencias obtenidas correctamente'
    };
  }

  @Auth(Role.TECH, Role.ADMIN, Role.RECEP, Role.CLIENT)
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EvidenciaTecnica> {
    return await this.evidenciaService.findOne(id);
  }

  @Auth(Role.TECH, Role.ADMIN, Role.RECEP)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('archivo'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateEvidenciaTecnicaDto,
    @UploadedFile() archivo?: Express.Multer.File,
  ): Promise<EvidenciaTecnica> {
    if (archivo) {
      updateDto.archivoUrl = `data:${archivo.mimetype};base64,${archivo.buffer.toString('base64')}`;
      updateDto.tipoArchivo = archivo.mimetype.startsWith('image') ? 'imagen' : 'video';
    }

    return await this.evidenciaService.update(id, updateDto);
  }

  @Auth(Role.TECH, Role.ADMIN, Role.RECEP)
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean; message: string }> {
    await this.evidenciaService.remove(id);
    return {
      success: true,
      message: `Evidencia técnica eliminada correctamente`
    };
  }
}