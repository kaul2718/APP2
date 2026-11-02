import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FirmaElectronicaService } from './firma-electronica.service';
import { Auth } from '../auth/decorators/auth.decorator';

@Controller('firma-electronica')
export class FirmaElectronicaController {
  constructor(private readonly firmaService: FirmaElectronicaService) {}

  @Auth('admin', 'tech', 'recep')
  @Get('status')
  async getStatus() {
    return await this.firmaService.getStatus();
  }

  @Auth('admin')
  @Post('config')
  @UseInterceptors(
    FileInterceptor('archivo', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máx
    }),
  )
  async guardarConfig(
    @UploadedFile() file: Express.Multer.File,
    @Body('password') password: string,
  ) {
    if (!file) {
      throw new BadRequestException('Debe adjuntar el archivo de firma (.p12 / .pfx).');
    }
    if (!password) {
      throw new BadRequestException('Debe ingresar la contraseña del certificado.');
    }

    return await this.firmaService.guardarConfig(
      file.buffer,
      file.originalname,
      password,
    );
  }

  @Auth('admin')
  @Delete('config')
  async eliminarConfig() {
    return await this.firmaService.eliminarConfig();
  }

  @Auth('admin')
  @Patch('toggle')
  async toggleActivo(@Body('activo') activo: boolean) {
    return await this.firmaService.toggleActivo(Boolean(activo));
  }

  @Auth('admin')
  @Post('test')
  async testFirma() {
    return await this.firmaService.testFirma();
  }
}
