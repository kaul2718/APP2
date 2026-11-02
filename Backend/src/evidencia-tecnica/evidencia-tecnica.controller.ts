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
import {
  CreateEvidenciaTecnicaDto,
  RequestPresignedUploadDto,
  ConfirmUploadDto,
} from './dto/create-evidencia-tecnica.dto';
import { UpdateEvidenciaTecnicaDto } from './dto/update-evidencia-tecnica.dto';
import { EvidenciaTecnica } from './entities/evidencia-tecnica.entity';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/user.decorator';

@Auth('admin', 'tech', 'recep')
@Controller('evidencias-tecnicas')
export class EvidenciaTecnicaController {
  constructor(private readonly evidenciaService: EvidenciaTecnicaService) {}

  /**
   * Subida estándar de evidencias (fotos) mediante NestJS hacia Cloudflare R2
   */
  @Auth('tech', 'admin', 'recep')
  @Post()
  @UseInterceptors(FileInterceptor('archivo'))
  async create(
    @Body() createDto: any,
    @UploadedFile() archivo?: Express.Multer.File,
  ): Promise<{ success: boolean; data: EvidenciaTecnica; message: string }> {
    createDto.ordenId = Number(createDto.ordenId);
    createDto.subidoPorId = Number(createDto.subidoPorId);
    if (createDto.highDetailMode !== undefined) {
      createDto.highDetailMode = createDto.highDetailMode === 'true' || createDto.highDetailMode === true;
    }

    if (!createDto.ordenId || isNaN(createDto.ordenId) || !createDto.subidoPorId || isNaN(createDto.subidoPorId)) {
      throw new BadRequestException('ordenId y subidoPorId deben ser números válidos y obligatorios.');
    }

    if (!archivo && !createDto.storageKey) {
      throw new BadRequestException('Debe proporcionar un archivo para subir a Cloudflare R2.');
    }

    const evidenciaCreada = await this.evidenciaService.create(createDto, archivo);

    return {
      success: true,
      data: evidenciaCreada,
      message: 'Evidencia técnica creada y almacenada exitosamente en Cloudflare R2',
    };
  }

  /**
   * Genera URL firmada para subida directa de videos o archivos grandes a R2
   */
  @Auth('tech', 'admin', 'recep')
  @Post('presigned-upload')
  async getPresignedUploadUrl(
    @Body() dto: RequestPresignedUploadDto,
    @CurrentUser() user: any,
  ) {
    dto.ordenId = Number(dto.ordenId);
    if (!dto.ordenId || isNaN(dto.ordenId)) {
      throw new BadRequestException('ordenId debe ser un número válido.');
    }

    const result = await this.evidenciaService.getPresignedUploadUrl(dto, user);
    return {
      success: true,
      data: result,
      message: 'URL prefirmada de subida generada exitosamente',
    };
  }

  /**
   * Confirma la subida directa a Cloudflare R2 y guarda los metadatos en PostgreSQL
   */
  @Auth('tech', 'admin', 'recep')
  @Post('confirm-upload')
  async confirmUpload(
    @Body() dto: ConfirmUploadDto,
    @CurrentUser() user: any,
  ) {
    dto.ordenId = Number(dto.ordenId);
    if (!dto.ordenId || isNaN(dto.ordenId)) {
      throw new BadRequestException('ordenId debe ser un número válido.');
    }

    const evidencia = await this.evidenciaService.confirmUpload(dto, user);
    return {
      success: true,
      data: evidencia,
      message: 'Evidencia confirmada y registrada exitosamente',
    };
  }

  /**
   * Consulta paginada de evidencias con aislamiento seguro de clientes
   */
  @Auth('tech', 'admin', 'recep', 'client')
  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query('ordenId') ordenId?: number,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ): Promise<{
    success: boolean;
    data: EvidenciaTecnica[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    message?: string;
  }> {
    if (page < 1) throw new BadRequestException('La página debe ser mayor o igual a 1');
    if (limit < 1 || limit > 100) throw new BadRequestException('El límite debe estar entre 1 y 100');

    const result = await this.evidenciaService.findAll(user, ordenId ? Number(ordenId) : undefined, page, limit);
    const totalPages = Math.ceil(result.total / limit);

    return {
      success: true,
      data: result.items,
      total: result.total,
      page: page,
      limit: limit,
      totalPages: totalPages,
      message: 'Evidencias obtenidas correctamente con URLs firmadas autorizadas',
    };
  }

  /**
   * Consulta individual de evidencia técnica
   */
  @Auth('tech', 'admin', 'recep', 'client')
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ): Promise<EvidenciaTecnica> {
    return await this.evidenciaService.findOne(id, user);
  }

  /**
   * Actualización de metadatos o archivo de evidencia
   */
  @Auth('tech', 'admin', 'recep')
  @Patch(':id')
  @UseInterceptors(FileInterceptor('archivo'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateEvidenciaTecnicaDto,
    @UploadedFile() archivo?: Express.Multer.File,
  ): Promise<EvidenciaTecnica> {
    return await this.evidenciaService.update(id, updateDto, archivo);
  }

  /**
   * Eliminación segura (Soft delete y limpieza en Cloudflare R2)
   */
  @Auth('tech', 'admin', 'recep')
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean; message: string }> {
    await this.evidenciaService.remove(id);
    return {
      success: true,
      message: 'Evidencia técnica eliminada correctamente',
    };
  }
}