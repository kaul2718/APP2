import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfiguracionSistemaService } from './configuracion-sistema.service';
import { UpdateConfiguracionSistemaDto } from './dto/update-configuracion-sistema.dto';
import { Auth } from '../auth/decorators/auth.decorator';

@Controller('configuracion-sistema')
export class ConfiguracionSistemaController {
  constructor(
    private readonly configuracionService: ConfiguracionSistemaService,
  ) {}

  /**
   * Obtiene la configuración actual del sistema y taller.
   * Accesible para Admin, Técnicos y Recepcionistas (para ver membrete e IVA).
   */
  @Auth('admin', 'tech', 'recep')
  @Get()
  async obtenerConfiguracion() {
    return await this.configuracionService.obtenerConfiguracion();
  }

  /**
   * Endpoint público sin autenticación para la Landing Page pública.
   * Retorna exclusivamente datos de contacto, ubicación, logo y horarios oficiales.
   */
  @Get('publica')
  async obtenerConfiguracionPublica() {
    return await this.configuracionService.obtenerConfiguracionPublica();
  }

  /**
   * Actualiza los parámetros de la empresa, secuenciales, IVA y políticas.
   * Restringido exclusivamente al Administrador.
   */
  @Auth('admin')
  @Patch()
  async actualizarConfiguracion(
    @Body() dto: UpdateConfiguracionSistemaDto,
  ) {
    return await this.configuracionService.actualizarConfiguracion(dto);
  }

  /**
   * Retorna una vista previa formateada del número de orden
   */
  @Auth('admin', 'tech', 'recep')
  @Get('preview-orden')
  obtenerPreview(
    @Query('prefijo') prefijo?: string,
    @Query('numero') numero?: string,
    @Query('digitos') digitos?: string,
  ) {
    const num = numero ? parseInt(numero, 10) : 1;
    const dig = digitos ? parseInt(digitos, 10) : 5;
    const preview = this.configuracionService.obtenerVistaPrevia(
      prefijo || '',
      num,
      dig,
    );
    return { preview };
  }

  /**
   * Sube o actualiza el logo corporativo del taller en Cloudflare R2
   */
  @Auth('admin')
  @Post('logo')
  @UseInterceptors(
    FileInterceptor('logo', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máx
    }),
  )
  async subirLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Debe adjuntar una imagen válida (PNG, JPG, WEBP).');
    }

    const mimeTypesPermitidos = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/svg+xml',
    ];
    if (!mimeTypesPermitidos.includes(file.mimetype)) {
      throw new BadRequestException('El formato de imagen debe ser SVG, PNG, JPG o WEBP.');
    }

    return await this.configuracionService.subirLogo(file.buffer, file.mimetype);
  }
}
