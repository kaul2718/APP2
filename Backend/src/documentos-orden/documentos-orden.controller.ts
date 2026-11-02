import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseIntPipe,
  Req,
  BadRequestException,
  ForbiddenException,
  UseInterceptors,
  ClassSerializerInterceptor,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DocumentosOrdenService } from './documentos-orden.service';
import { FirmarDocumentoDto } from './dto/firmar-documento.dto';
import { TipoDocumentoOrden } from './entities/documento-orden.entity';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { User } from '../users/entities/user.entity';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('orders/:id/documentos')
export class DocumentosOrdenController {
  constructor(private readonly documentosService: DocumentosOrdenService) {}

  @Auth('admin', 'tech', 'recep')
  @Post('firmar')
  async firmarDocumento(
    @Param('id', ParseIntPipe) orderId: number,
    @Body() dto: FirmarDocumentoDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const operadorId = user.sub || user.id;
    if (!operadorId) {
      throw new BadRequestException('Operador no autenticado.');
    }

    const ipCliente =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      req.ip;
    const userAgent = req.headers['user-agent'];

    return await this.documentosService.registrarFirma(
      orderId,
      dto,
      operadorId,
      ipCliente,
      userAgent,
    );
  }

  @Auth('admin', 'tech', 'recep', 'client')
  @Get()
  async getDocumentosByOrder(
    @Param('id', ParseIntPipe) orderId: number,
    @CurrentUser() user: any,
  ) {
    const isClient = user?.role === 'client' || user?.role === 'cliente';
    const userId = user?.sub || user?.id;
    if (isClient) {
      const pertenece = await this.documentosService.verificarPropiedadCliente(orderId, userId);
      if (!pertenece) {
        throw new ForbiddenException('No tiene permisos para ver documentos de esta orden.');
      }
    }
    return await this.documentosService.findByOrder(orderId);
  }

  @Auth('admin', 'tech', 'recep', 'client')
  @Get('tipo/:tipo')
  async getLatestDocumento(
    @Param('id', ParseIntPipe) orderId: number,
    @Param('tipo') tipo: string,
    @CurrentUser() user: any,
  ) {
    const isClient = user?.role === 'client' || user?.role === 'cliente';
    const userId = user?.sub || user?.id;
    if (isClient) {
      const pertenece = await this.documentosService.verificarPropiedadCliente(orderId, userId);
      if (!pertenece) {
        throw new ForbiddenException('No tiene permisos para ver documentos de esta orden.');
      }
    }
    const tipoEnum = tipo.toUpperCase() as TipoDocumentoOrden;
    if (!Object.values(TipoDocumentoOrden).includes(tipoEnum)) {
      throw new BadRequestException(`Tipo de documento inválido: ${tipo}`);
    }
    return await this.documentosService.findLatestByType(orderId, tipoEnum);
  }

  @Auth('admin', 'tech', 'recep', 'client')
  @Get('preview/:tipo')
  async getPdfPreview(
    @Param('id', ParseIntPipe) orderId: number,
    @Param('tipo') tipo: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const isClient = user?.role === 'client' || user?.role === 'cliente';
    const userId = user?.sub || user?.id;
    if (isClient) {
      const pertenece = await this.documentosService.verificarPropiedadCliente(orderId, userId);
      if (!pertenece) {
        throw new ForbiddenException('No tiene permisos para ver documentos de esta orden.');
      }
    }
    const tipoEnum = tipo.toUpperCase() as TipoDocumentoOrden;
    if (!Object.values(TipoDocumentoOrden).includes(tipoEnum)) {
      throw new BadRequestException(`Tipo de documento inválido: ${tipo}`);
    }
    const operadorId = user?.sub || user?.id || 1;
    const pdfBuffer = await this.documentosService.obtenerPdfBuffer(
      orderId,
      tipoEnum,
      operadorId,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="ODS_${orderId}_${tipoEnum}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }
}

