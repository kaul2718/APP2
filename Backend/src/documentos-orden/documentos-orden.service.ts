import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DocumentoOrden,
  TipoDocumentoOrden,
  EstadoFirmaDocumento,
} from './entities/documento-orden.entity';
import { FirmarDocumentoDto } from './dto/firmar-documento.dto';
import { Order } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';
import { StorageService } from '../storage/storage.service';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FirmaElectronicaService } from '../firma-electronica/firma-electronica.service';
import { ConfiguracionSistemaService } from '../configuracion-sistema/configuracion-sistema.service';
import * as QRCode from 'qrcode';
const sharp = require('sharp');

function formatEncendidoPdf(val?: string): string {
  switch (val) {
    case 'correcto': return 'Enciende correctamente';
    case 'falla': return 'No enciende / Falla en encendido';
    case 'intermitente': return 'Encendido intermitente';
    case 'no_probado':
    default:
      return 'No probado al recibir';
  }
}

function formatFisicoPdf(val?: string): string {
  switch (val) {
    case 'bueno': return 'Buen estado';
    case 'desgaste': return 'Rayones / Desgaste';
    case 'danado': return 'Golpe / Fisura';
    case 'roto': return 'Roto / Faltante';
    case 'no_aplica': return 'N/A';
    case 'no_revisado':
    default:
      return 'No revisado';
  }
}

function formatFuncionalPdf(val?: string): string {
  switch (val) {
    case 'funciona': return 'Funciona';
    case 'falla': return 'Falla confirmada';
    case 'intermitente': return 'Intermitente';
    case 'no_aplica': return 'N/A';
    case 'no_probado':
    default:
      return 'No probado';
  }
}

@Injectable()
export class DocumentosOrdenService {
  private readonly logger = new Logger(DocumentosOrdenService.name);

  constructor(
    @InjectRepository(DocumentoOrden)
    private readonly documentoRepository: Repository<DocumentoOrden>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly storageService: StorageService,
    private readonly firmaElectronicaService: FirmaElectronicaService,
    private readonly configuracionSistemaService: ConfiguracionSistemaService,
  ) {}

  /**
   * Resuelve URLs firmadas SigV4 temporales para PDF y firma
   */
  async resolveUrls(documento: DocumentoOrden): Promise<DocumentoOrden> {
    if (documento.storageKeyPdf) {
      try {
        documento.archivoPdfUrl = await this.storageService.getPresignedUrl(
          documento.storageKeyPdf,
          600, // 10 minutos
        );
      } catch (err) {
        this.logger.warn(`Error resolviendo URL PDF: ${err.message}`);
      }
    }
    if (documento.storageKeyFirma) {
      try {
        documento.archivoFirmaUrl = await this.storageService.getPresignedUrl(
          documento.storageKeyFirma,
          600,
        );
      } catch (err) {
        this.logger.warn(`Error resolviendo URL Firma: ${err.message}`);
      }
    }
    return documento;
  }

  /**
   * Obtiene todos los documentos asociados a una orden
   */
  async findByOrder(orderId: number): Promise<DocumentoOrden[]> {
    const docs = await this.documentoRepository.find({
      where: { ordenId: orderId },
      relations: ['registradoPor'],
      order: { fechaFirma: 'DESC' },
    });
    return Promise.all(docs.map((d) => this.resolveUrls(d)));
  }

  /**
   * Obtiene el documento más reciente de un tipo específico para la orden
   */
  async findLatestByType(
    orderId: number,
    tipo: TipoDocumentoOrden,
  ): Promise<DocumentoOrden | null> {
    const doc = await this.documentoRepository.findOne({
      where: { ordenId: orderId, tipoDocumento: tipo },
      relations: ['registradoPor'],
      order: { fechaFirma: 'DESC' },
    });
    if (!doc) return null;
    return this.resolveUrls(doc);
  }

  /**
   * Verifica si una orden pertenece al cliente especificado
   */
  async verificarPropiedadCliente(orderId: number, clientId: number): Promise<boolean> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['client'],
    });
    if (!order) return false;
    return order.client?.id === clientId;
  }


  /**
   * Obtiene el buffer PDF canónico para vista previa o impresión directa.
   * Si ya existe firmado en R2, descarga ese archivo exacto de R2.
   * Si aún no está firmado, genera la vista previa en memoria con estado PENDIENTE.
   */
  async obtenerPdfBuffer(
    orderId: number,
    tipo: TipoDocumentoOrden,
    operadorId: number,
  ): Promise<Buffer> {
    const orden = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: [
        'client',
        'equipo',
        'equipo.tipoEquipo',
        'equipo.marca',
        'equipo.modelo',
        'presupuesto',
        'presupuesto.detallesPresupuestoItems',
        'presupuesto.detallesPresupuestoItems.parte',
        'estadoOrden',
      ],
    });

    if (!orden) {
      throw new NotFoundException(`Orden #${orderId} no encontrada.`);
    }

    const docExistente = await this.documentoRepository.findOne({
      where: { ordenId: orderId, tipoDocumento: tipo },
      order: { fechaFirma: 'DESC' },
    });

    if (docExistente?.storageKeyPdf) {
      try {
        return await this.storageService.getFileBuffer(docExistente.storageKeyPdf);
      } catch (err) {
        this.logger.warn(
          `No se pudo obtener PDF de R2 [${docExistente.storageKeyPdf}], generando dinámico: ${err.message}`,
        );
      }
    }

    // Si aún no está firmado, generar PDF canónico en memoria
    const clienteNombre = orden.client
      ? `${orden.client.nombre || ''} ${orden.client.apellido || ''}`.trim()
      : 'Cliente General';
    const clienteCedula = (orden.client as any)?.cedula || 'N/D';

    const dto: FirmarDocumentoDto = {
      tipoDocumento: tipo,
      firmanteNombre: clienteNombre,
      firmanteIdentificacion: clienteCedula,
      estadoFirma: EstadoFirmaDocumento.PENDIENTE,
    };

    const operador =
      (await this.userRepository.findOne({ where: { id: operadorId } })) ||
      ({ nombre: 'Recepción', apellido: 'HDC' } as User);

    const pdfBytes = await this.generarPdfCanonico(orden, dto, operador, null);
    return Buffer.from(pdfBytes);
  }

  /**
   * Procesa la firma digitalizada desde tablet, genera el PDF canónico,
   * calcula el hash SHA-256, sube a Cloudflare R2 y guarda metadatos.
   */
  async registrarFirma(
    orderId: number,
    dto: FirmarDocumentoDto,
    operadorId: number,
    ipCliente?: string,
    userAgent?: string,
  ): Promise<DocumentoOrden> {
    const orden = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: [
        'client',
        'equipo',
        'equipo.tipoEquipo',
        'equipo.marca',
        'equipo.modelo',
        'presupuesto',
        'presupuesto.detallesPresupuestoItems',
        'presupuesto.detallesPresupuestoItems.parte',
        'estadoOrden',
      ],
    });

    if (!orden) {
      throw new NotFoundException(`Orden #${orderId} no encontrada.`);
    }

    const operador = await this.userRepository.findOne({
      where: { id: operadorId },
    });
    if (!operador) {
      throw new NotFoundException(`Usuario operador #${operadorId} no encontrado.`);
    }

    const isFirmado =
      !dto.estadoFirma || dto.estadoFirma === EstadoFirmaDocumento.FIRMADO;

    let firmaBuffer: Buffer | null = null;
    let storageKeyFirma: string | null = null;

    if (isFirmado) {
      if (!dto.firmaBase64) {
        throw new BadRequestException(
          'Se requiere la imagen de la firma manuscrita para confirmar el documento.',
        );
      }

      // Convertir data URL base64 a buffer binario
      const base64Data = dto.firmaBase64.replace(/^data:image\/\w+;base64,/, '');
      firmaBuffer = Buffer.from(base64Data, 'base64');

      // Subir la imagen de la firma PNG a Cloudflare R2
      const firmaUuid = uuidv4();
      const odsFolder = `ODS-${orden.workOrderNumber}`;
      storageKeyFirma = `ordenes/${odsFolder}/firmas/firma_${dto.tipoDocumento.toLowerCase()}_${firmaUuid}.png`;

      await this.storageService.uploadFile(
        storageKeyFirma,
        firmaBuffer,
        'image/png',
        {
          ordenId: String(orderId),
          workOrderNumber: String(orden.workOrderNumber),
          tipo: dto.tipoDocumento,
          firmanteIdentificacion: dto.firmanteIdentificacion,
        },
      );
    }

    // Generar el PDF canónico sellado con pdf-lib
    const rawPdfBytes = await this.generarPdfCanonico(
      orden,
      dto,
      operador,
      firmaBuffer,
    );

    // Firmar criptográficamente con PAdES (.p12 FirmaEC) si la firma electrónica del Gerente está activa
    const pdfBytes = await this.firmaElectronicaService.firmarPdfCriptografico(
      Buffer.from(rawPdfBytes),
      `Acta de ${dto.tipoDocumento === TipoDocumentoOrden.RECEPCION ? 'Recepción e Ingreso' : 'Entrega y Garantía'} ODS #${orden.workOrderNumber}`,
      'Riobamba, Ecuador',
    );

    // Calcular hash criptográfico SHA-256 del PDF final
    const pdfSha256 = crypto
      .createHash('sha256')
      .update(pdfBytes)
      .digest('hex');

    // Subir el PDF generado a Cloudflare R2
    const pdfUuid = uuidv4().substring(0, 8);
    const odsFolder = `ODS-${orden.workOrderNumber}`;
    const storageKeyPdf = `ordenes/${odsFolder}/documentos/acta_${dto.tipoDocumento.toLowerCase()}_ODS-${orden.workOrderNumber}_${pdfUuid}.pdf`;

    await this.storageService.uploadFile(
      storageKeyPdf,
      pdfBytes,
      'application/pdf',
      {
        ordenId: String(orderId),
        tipoDocumento: dto.tipoDocumento,
        sha256: pdfSha256,
        firmanteNombre: dto.firmanteNombre,
        firmanteIdentificacion: dto.firmanteIdentificacion,
      },
    );

    // Persistir el registro en PostgreSQL
    const nuevoDocumento = this.documentoRepository.create({
      orden,
      ordenId: orderId,
      tipoDocumento: dto.tipoDocumento,
      storageKeyPdf,
      storageKeyFirma: storageKeyFirma || undefined,
      pdfSha256,
      versionTerminos: dto.versionTerminos || 'v1.0-2026',
      terminosAceptados: dto.terminosAceptados !== false,
      firmanteNombre: dto.firmanteNombre,
      firmanteIdentificacion: dto.firmanteIdentificacion,
      estadoFirma: dto.estadoFirma || EstadoFirmaDocumento.FIRMADO,
      motivoSinFirma: dto.motivoSinFirma,
      ipCliente,
      userAgent,
      registradoPor: operador,
      registradoPorId: operador.id,
    });

    const guardado = await this.documentoRepository.save(nuevoDocumento);
    this.logger.log(
      `✓ Documento [${dto.tipoDocumento}] registrado exitosamente para ODS #${orden.workOrderNumber}. SHA-256: ${pdfSha256}`,
    );

    // Desvincular orden para evitar cualquier riesgo de serialización circular en ClassSerializerInterceptor
    delete (guardado as any).orden;

    return this.resolveUrls(guardado);
  }

  /**
   * Genera el documento PDF canónico con formato A4 estructurado
   */
  private async generarPdfCanonico(
    orden: Order,
    dto: FirmarDocumentoDto,
    operador: User,
    firmaBuffer: Buffer | null,
  ): Promise<Uint8Array> {
    if (
      dto.tipoDocumento === TipoDocumentoOrden.AUTORIZACION_PRESUPUESTO ||
      dto.tipoDocumento === TipoDocumentoOrden.RECHAZO_PRESUPUESTO
    ) {
      return await this.generarPdfPresupuestoCanonico(orden, dto, operador, firmaBuffer);
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 estándar (puntos: 72 dpi)
    const { width, height } = page.getSize();

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const isRecepcion = dto.tipoDocumento === TipoDocumentoOrden.RECEPCION;
    
    // Paleta de colores idéntica a la vista moderna del Frontend
    const brandDark = rgb(0.06, 0.09, 0.16); // #0f172a (Slate 900)
    const textDark = rgb(0.12, 0.16, 0.22); // #1f2937 (Gray 800)
    const textMuted = rgb(0.42, 0.46, 0.53); // #6b7280 (Gray 500)
    const borderLight = rgb(0.85, 0.88, 0.92); // #e2e8f0 (Slate 200)
    const bgLight = rgb(0.97, 0.98, 0.99); // #f8fafc (Slate 50)
    const primaryBlue = rgb(0.12, 0.45, 0.88);

    let y = height - 40;

    // 0. Obtener configuración corporativa del sistema
    let config: any = null;
    try {
      config = await this.configuracionSistemaService.obtenerConfiguracion();
    } catch (err) {
      this.logger.warn(`No se pudo cargar configuración corporativa para PDF: ${err.message}`);
    }

    // --- 1. ENCABEZADO CON LOGO OFICIAL ---
    let logoEmbedded = false;

    // A. Prioridad 1: Logo corporativo dinámico configurado en el sistema (Cloudflare R2 / Almacenamiento)
    if (config?.storageKeyLogo) {
      try {
        const logoBuffer = await this.storageService.getFileBuffer(config.storageKeyLogo);
        let finalLogoBuffer = logoBuffer;

        const isSvg =
          config.storageKeyLogo.toLowerCase().endsWith('.svg') ||
          logoBuffer.toString('utf-8', 0, 100).includes('<svg');
        const isWebp = config.storageKeyLogo.toLowerCase().endsWith('.webp');

        if (isSvg) {
          finalLogoBuffer = await sharp(logoBuffer, { density: 300 }).png().toBuffer();
        } else if (isWebp) {
          finalLogoBuffer = await sharp(logoBuffer).png().toBuffer();
        }

        let embeddedLogo: any;
        try {
          embeddedLogo = await pdfDoc.embedPng(finalLogoBuffer);
        } catch {
          embeddedLogo = await pdfDoc.embedJpg(finalLogoBuffer);
        }

        if (embeddedLogo) {
          const logoDims = embeddedLogo.scaleToFit(165, 44);
          page.drawImage(embeddedLogo, {
            x: 40,
            y: y - logoDims.height,
            width: logoDims.width,
            height: logoDims.height,
          });
          logoEmbedded = true;
        }
      } catch (e) {
        this.logger.warn(`No se pudo incrustar logo corporativo desde R2 [${config.storageKeyLogo}]: ${e.message}`);
      }
    }

    // B. Prioridad 2: Fallback a logo_hdc.png por defecto en disco si no hay logo corporativo o falló
    if (!logoEmbedded) {
      const logoPaths = [
        path.join(process.cwd(), 'assets', 'logo_hdc.png'),
        path.join(process.cwd(), '..', 'Backend', 'assets', 'logo_hdc.png'),
      ];
      for (const lp of logoPaths) {
        if (fs.existsSync(lp)) {
          try {
            const logoBuffer = fs.readFileSync(lp);
            const embeddedLogo = await pdfDoc.embedPng(logoBuffer);
            const logoDims = embeddedLogo.scaleToFit(165, 42);
            page.drawImage(embeddedLogo, {
              x: 40,
              y: y - logoDims.height,
              width: logoDims.width,
              height: logoDims.height,
            });
            logoEmbedded = true;
            break;
          } catch (e) {
            this.logger.warn(`No se pudo incrustar logo PNG por defecto: ${e.message}`);
          }
        }
      }
    }

    // C. Prioridad 3: Texto de respaldo
    if (!logoEmbedded) {
      const nombreEmpresa = config?.nombreComercial || config?.nombreEmpresa || 'Hospital del Computador';
      page.drawText(nombreEmpresa, {
        x: 40,
        y: y - 20,
        size: 18,
        font: fontBold,
        color: rgb(0.92, 0.55, 0.1),
      });
    }

    let needsPage2 = false;

    // Recuadro superior derecho: N° de Orden y Tipo (Idéntico a la 2da imagen)
    const boxWidth = 140;
    const boxHeight = 44;
    const boxX = width - 40 - boxWidth;
    const boxY = y - boxHeight + 4;

    page.drawRectangle({
      x: boxX,
      y: boxY,
      width: boxWidth,
      height: boxHeight,
      borderWidth: 1.8,
      borderColor: brandDark,
      color: rgb(1, 1, 1),
    });

    const boxTitle = isRecepcion ? 'ORDEN DE SERVICIO' : 'ACTA DE ENTREGA';
    page.drawText(boxTitle, {
      x: boxX + (boxWidth - fontBold.widthOfTextAtSize(boxTitle, 7)) / 2,
      y: boxY + 28,
      size: 7,
      font: fontBold,
      color: textMuted,
    });

    const orderNumStr = `#${orden.workOrderNumber}`;
    page.drawText(orderNumStr, {
      x: boxX + (boxWidth - fontBold.widthOfTextAtSize(orderNumStr, 18)) / 2,
      y: boxY + 8,
      size: 18,
      font: fontBold,
      color: brandDark,
    });

    // Fecha debajo del recuadro
    const fechaObj = new Date();
    const fechaLarga = `FECHA: ${fechaObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}`;
    page.drawText(fechaLarga, {
      x: width - 40 - fontBold.widthOfTextAtSize(fechaLarga, 6.8),
      y: boxY - 12,
      size: 6.8,
      font: fontBold,
      color: brandDark,
    });

    // Datos de contacto dinámicos debajo del logo
    const contactY = y - 50;
    const dirText = config?.direccion ? `• ${config.direccion.toUpperCase()}` : '• VELOZ, ENTRE DIEGO DE IBARRA Y URUGUAY';
    const tels = [config?.telefono, config?.whatsapp].filter(Boolean).join(' - ');
    const telText = tels ? `• ${tels}` : '• 0959081140 - 0999959595';
    const contactoText = config?.correoContacto ? `• ${config.correoContacto.toUpperCase()}` : '• WWW.HOSPITALCOMPUTADOR.COM';

    page.drawText(dirText.substring(0, 52), {
      x: 40,
      y: contactY,
      size: 6.8,
      font: fontBold,
      color: textMuted,
    });
    page.drawText(telText.substring(0, 48), {
      x: 40,
      y: contactY - 10,
      size: 6.8,
      font: fontBold,
      color: textMuted,
    });
    page.drawText(contactoText.substring(0, 48), {
      x: 40,
      y: contactY - 20,
      size: 6.8,
      font: fontBold,
      color: textMuted,
    });

    // Línea divisoria principal horizontal
    y -= 84;
    page.drawLine({
      start: { x: 40, y },
      end: { x: width - 40, y },
      thickness: 1.5,
      color: brandDark,
    });

    // --- 2. TARJETAS: DATOS DEL CLIENTE Y DEL EQUIPO (Idéntico a imagen 2) ---
    y -= 14;
    const cardWidth = 248;
    const cardHeight = 72;
    const card1X = 40;
    const card2X = width - 40 - cardWidth;
    const cardY = y - cardHeight;

    // Tarjeta 1: Cliente
    page.drawRectangle({
      x: card1X,
      y: cardY,
      width: cardWidth,
      height: cardHeight,
      borderWidth: 1,
      borderColor: borderLight,
      color: bgLight,
    });
    page.drawText('DATOS DEL CLIENTE', {
      x: card1X + 12,
      y: cardY + cardHeight - 16,
      size: 7.5,
      font: fontBold,
      color: textMuted,
    });
    page.drawLine({
      start: { x: card1X + 12, y: cardY + cardHeight - 20 },
      end: { x: card1X + cardWidth - 12, y: cardY + cardHeight - 20 },
      thickness: 0.5,
      color: borderLight,
    });

    const clienteNombre = orden.client
      ? `${orden.client.nombre || ''} ${orden.client.apellido || ''}`.trim()
      : dto.firmanteNombre;
    const clienteCedula = (orden.client as any)?.cedula || dto.firmanteIdentificacion;
    const clienteTelf = orden.client?.telefono || 'No registrado';
    const fechaCreacionStr = orden.createdAt ? new Date(orden.createdAt).toLocaleDateString() : 'N/D';

    page.drawText(`Nombre: ${clienteNombre.substring(0, 32)}`, {
      x: card1X + 12,
      y: cardY + 34,
      size: 7.5,
      font: fontBold,
      color: textDark,
    });
    page.drawText(`Rol / Tipo: Cliente | C.I.: ${clienteCedula}`, {
      x: card1X + 12,
      y: cardY + 22,
      size: 7.2,
      font: fontRegular,
      color: textDark,
    });
    page.drawText(`Teléfono: ${clienteTelf} | Orden Creada: ${fechaCreacionStr}`, {
      x: card1X + 12,
      y: cardY + 10,
      size: 7.2,
      font: fontRegular,
      color: textDark,
    });

    // Tarjeta 2: Equipo
    page.drawRectangle({
      x: card2X,
      y: cardY,
      width: cardWidth,
      height: cardHeight,
      borderWidth: 1,
      borderColor: borderLight,
      color: bgLight,
    });
    page.drawText('ESPECIFICACIONES DEL EQUIPO', {
      x: card2X + 12,
      y: cardY + cardHeight - 16,
      size: 7.5,
      font: fontBold,
      color: textMuted,
    });
    page.drawLine({
      start: { x: card2X + 12, y: cardY + cardHeight - 20 },
      end: { x: card2X + cardWidth - 12, y: cardY + cardHeight - 20 },
      thickness: 0.5,
      color: borderLight,
    });

    const tipoEq = orden.equipo?.tipoEquipo?.nombre || 'General';
    const marcaMod = `${orden.equipo?.marca?.nombre || 'N/D'} ${orden.equipo?.modelo?.nombre || ''}`.trim();
    const serieEq = orden.equipo?.numeroSerie || 'Sin número de serie';

    page.drawText(`Tipo: ${tipoEq}`, {
      x: card2X + 12,
      y: cardY + 34,
      size: 7.5,
      font: fontBold,
      color: textDark,
    });
    page.drawText(`Marca / Modelo: ${marcaMod.substring(0, 30)}`, {
      x: card2X + 12,
      y: cardY + 22,
      size: 7.2,
      font: fontRegular,
      color: textDark,
    });
    page.drawText(`N° de Serie: ${serieEq.substring(0, 28)}`, {
      x: card2X + 12,
      y: cardY + 10,
      size: 7.2,
      font: fontRegular,
      color: textDark,
    });

    // --- 3. PROBLEMA REPORTADO EN RECEPCIÓN ---
    y = cardY - 14;
    const probHeight = 44;
    const probY = y - probHeight;
    page.drawRectangle({
      x: 40,
      y: probY,
      width: width - 80,
      height: probHeight,
      borderWidth: 1,
      borderColor: borderLight,
      color: bgLight,
    });
    page.drawText('PROBLEMA REPORTADO EN RECEPCIÓN', {
      x: 52,
      y: probY + probHeight - 15,
      size: 7.5,
      font: fontBold,
      color: textMuted,
    });
    const probStr = (orden.problemaReportado || 'Sin reporte detallado').substring(0, 140);
    page.drawText(`"${probStr}"`, {
      x: 52,
      y: probY + 14,
      size: 8.5,
      font: fontOblique,
      color: textDark,
    });

    // --- 4. SECCIONES INTERMEDIAS SEGÚN RECEPCIÓN O ENTREGA ---
    if (!isRecepcion) {
      // SECCIÓN: TRABAJOS Y ACTIVIDADES REALIZADAS
      y = probY - 18;
      page.drawText('TRABAJOS Y ACTIVIDADES REALIZADAS', {
        x: 40,
        y,
        size: 9,
        font: fontBold,
        color: brandDark,
      });
      y -= 6;
      page.drawLine({
        start: { x: 40, y },
        end: { x: width - 40, y },
        thickness: 1,
        color: borderLight,
      });

      y -= 10;
      const act = orden.actividades || [];
      if (act.length > 0) {
        const maxAct = Math.min(act.length, 3);
        const actBoxH = maxAct * 18 + 12;
        y -= actBoxH;
        page.drawRectangle({
          x: 40,
          y,
          width: width - 80,
          height: actBoxH,
          borderWidth: 1,
          borderColor: borderLight,
          color: bgLight,
        });
        let curActY = y + actBoxH - 14;
        for (let i = 0; i < maxAct; i++) {
          const a = act[i];
          const fStr = a.fecha ? new Date(a.fecha).toLocaleDateString() : '';
          const actTexto = `${fStr} [${a.tipoActividad?.nombre || 'Técnico'}]: ${a.trabajoRealizado || ''}`;
          page.drawText(`• ${actTexto.substring(0, 95)}`, {
            x: 50,
            y: curActY,
            size: 7.2,
            font: fontRegular,
            color: textDark,
          });
          curActY -= 16;
        }
      } else {
        const actHeight = 28;
        y -= actHeight;
        page.drawRectangle({
          x: 40,
          y,
          width: width - 80,
          height: actHeight,
          borderWidth: 1,
          borderColor: borderLight,
          color: bgLight,
        });
        page.drawText('No se registraron bitácoras técnicas para esta orden.', {
          x: 52,
          y: y + 10,
          size: 7.5,
          font: fontOblique,
          color: textMuted,
        });
      }

      // SECCIÓN: DETALLE DE COSTOS Y PRESUPUESTO
      y -= 18;
      page.drawText('DETALLE DE COSTOS Y PRESUPUESTO', {
        x: 40,
        y,
        size: 9,
        font: fontBold,
        color: brandDark,
      });
      y -= 6;
      page.drawLine({
        start: { x: 40, y },
        end: { x: width - 40, y },
        thickness: 1,
        color: borderLight,
      });

      y -= 10;
      const items = orden.presupuesto?.detallesPresupuestoItems || [];
      if (items.length > 0) {
        const maxItems = Math.min(items.length, 3);
        const presBoxH = maxItems * 18 + 18;
        y -= presBoxH;
        page.drawRectangle({
          x: 40,
          y,
          width: width - 80,
          height: presBoxH,
          borderWidth: 1,
          borderColor: borderLight,
          color: bgLight,
        });
        let curPresY = y + presBoxH - 14;
        let total = 0;
        for (let i = 0; i < maxItems; i++) {
          const it = items[i];
          const subtotal = Number(it.subtotal || 0);
          total += subtotal;
          const concepto = it.parte?.nombre || 'Servicio / Repuesto técnico';
          page.drawText(`• ${concepto.substring(0, 55)} (Cant: ${it.cantidad || 1})`, {
            x: 50,
            y: curPresY,
            size: 7.2,
            font: fontRegular,
            color: textDark,
          });
          page.drawText(`$${subtotal.toFixed(2)}`, {
            x: width - 90,
            y: curPresY,
            size: 7.2,
            font: fontBold,
            color: textDark,
          });
          curPresY -= 16;
        }
        page.drawText(`TOTAL: $${total.toFixed(2)}`, {
          x: width - 110,
          y: y + 4,
          size: 7.5,
          font: fontBold,
          color: primaryBlue,
        });
      } else {
        const presHeight = 28;
        y -= presHeight;
        page.drawRectangle({
          x: 40,
          y,
          width: width - 80,
          height: presHeight,
          borderWidth: 1,
          borderColor: borderLight,
          color: bgLight,
        });
        page.drawText('Esta orden no tiene ítems de presupuesto registrados o se realizó sin costo.', {
          x: 52,
          y: y + 10,
          size: 7.5,
          font: fontOblique,
          color: textMuted,
        });
      }
    } else {
      // Recepción: Accesorios y Peritaje
      y = probY - 14;
      const accStr =
        orden.accesorios && orden.accesorios.length > 0
          ? orden.accesorios.join(', ')
          : 'Ninguno registrado';
      page.drawText(`Accesorios entregados por el cliente: ${accStr}`, {
        x: 40,
        y,
        size: 7.8,
        font: fontBold,
        color: textDark,
      });

      const checklist = orden.checklistData;

      if (checklist) {
        y -= 15;
        page.drawText('INSPECCIÓN INICIAL DE RECEPCIÓN (ESTADO INICIAL):', {
          x: 40,
          y,
          size: 8.5,
          font: fontBold,
          color: brandDark,
        });
        y -= 5;
        page.drawLine({
          start: { x: 40, y },
          end: { x: width - 40, y },
          thickness: 1,
          color: borderLight,
        });
        y -= 9;

        if (checklist.version === 2) {
          const rec = checklist.inspeccionRecepcion;
          const comp = checklist.inspeccionComplementaria;
          const encendidoStr = formatEncendidoPdf(rec?.estadoEncendido);
          const fisCount = rec?.fisica?.length || 0;
          const funcCount = rec?.funcional?.length || 0;
          const totalItems = fisCount + funcCount + (comp ? (comp.fisica?.length || 0) + (comp.funcional?.length || 0) : 0);

          if (totalItems > 3 || comp) {
            needsPage2 = true;
            page.drawText(`• Encendido al recibir: ${encendidoStr}`, {
              x: 45,
              y,
              size: 7.2,
              font: fontBold,
              color: textDark,
            });
            y -= 11;
            page.drawText(`• Inspección física (${fisCount} puntos) y funcional (${funcCount} pruebas) registradas.`, {
              x: 45,
              y,
              size: 7.2,
              font: fontRegular,
              color: textDark,
            });
            y -= 11;
            if (comp) {
              const authTxt = comp.autorizacionCliente?.autorizado ? 'Autorizado por cliente' : 'Pendiente autorización';
              page.drawText(`• Escalamiento a Orden Completa: ${comp.motivoEscalamiento.substring(0, 55)} (${authTxt})`, {
                x: 45,
                y,
                size: 7.2,
                font: fontBold,
                color: brandDark,
              });
              y -= 11;
            }
            page.drawText('• >> Ver detalle exhaustivo de inspección en el Anexo Técnico adjunto (Página 2) <<', {
              x: 45,
              y,
              size: 7.2,
              font: fontOblique,
              color: textMuted,
            });
            y -= 11;
          } else {
            page.drawText(`• Encendido: ${encendidoStr}`, {
              x: 45,
              y,
              size: 7.2,
              font: fontBold,
              color: textDark,
            });
            y -= 11;
            if (rec?.fisica) {
              for (const f of rec.fisica) {
                const obs = f.observaciones ? ` (${f.observaciones})` : '';
                page.drawText(`• [Físico] ${f.item}: ${formatFisicoPdf(f.estado)}${obs}`.substring(0, 95), {
                  x: 45,
                  y,
                  size: 7.2,
                  font: fontRegular,
                  color: textDark,
                });
                y -= 11;
              }
            }
            if (rec?.funcional) {
              for (const fn of rec.funcional) {
                const obs = fn.observaciones ? ` (${fn.observaciones})` : '';
                page.drawText(`• [Funcional] ${fn.item}: ${formatFuncionalPdf(fn.estado)}${obs}`.substring(0, 95), {
                  x: 45,
                  y,
                  size: 7.2,
                  font: fontRegular,
                  color: textDark,
                });
                y -= 11;
              }
            }
          }
        } else if (Array.isArray(checklist.results) && checklist.results.length > 0) {
          if (checklist.results.length > 3) {
            needsPage2 = true;
            for (let i = 0; i < Math.min(checklist.results.length, 2); i++) {
              const item = checklist.results[i];
              page.drawText(`• ${item.item}: Funcionalidad: ${item.funcional || 'OK'} | Estética: ${item.estetica || 'OK'}`.substring(0, 95), {
                x: 45,
                y,
                size: 7.2,
                font: fontRegular,
                color: textDark,
              });
              y -= 11;
            }
            page.drawText(`• Ver los ${checklist.results.length} puntos en el Anexo Técnico adjunto (Página 2)`, {
              x: 45,
              y,
              size: 7.2,
              font: fontOblique,
              color: textMuted,
            });
            y -= 11;
          } else {
            for (const item of checklist.results) {
              page.drawText(`• ${item.item}: Funcionalidad: ${item.funcional || 'OK'} | Estética: ${item.estetica || 'OK'}`.substring(0, 95), {
                x: 45,
                y,
                size: 7.2,
                font: fontRegular,
                color: textDark,
              });
              y -= 11;
            }
          }
        }
      }
    }

    // --- 5. TÉRMINOS Y CONDICIONES / CONFORMIDAD (Línea gruesa) ---
    y -= 18;
    page.drawLine({
      start: { x: 40, y },
      end: { x: width - 40, y },
      thickness: 1.5,
      color: brandDark,
    });

    y -= 12;
    const terminosTitulo = isRecepcion
      ? 'TÉRMINOS Y CONDICIONES DE RECEPCIÓN:'
      : 'CONFORMIDAD DEL SERVICIO Y GARANTÍA:';
    page.drawText(terminosTitulo, {
      x: 40,
      y,
      size: 7.8,
      font: fontBold,
      color: brandDark,
    });

    let terminosLineas: string[] = [];
    if (isRecepcion) {
      if (config?.terminosRecepcion) {
        terminosLineas = config.terminosRecepcion
          .split('\n')
          .map((l: string) => l.trim())
          .filter(Boolean);
      } else {
        terminosLineas = [
          '1. RESPALDO DE INFORMACIÓN: Hospital del Computador no se responsabiliza por la pérdida de datos o software instalado en los dispositivos de almacenamiento.',
          '2. CLÁUSULA DE ABANDONO: Equipos no retirados tras el plazo reglamentario causarán costos de bodegaje y podrán ser considerados legalmente en abandono.',
          '3. DIAGNÓSTICO PRELIMINAR: La revisión inicial es presuntiva y sujeta a confirmación en laboratorio tras apertura y revisión especializada.',
        ];
      }
    } else {
      if (config?.terminosEntrega) {
        terminosLineas = config.terminosEntrega
          .split('\n')
          .map((l: string) => l.trim())
          .filter(Boolean);
      } else {
        terminosLineas = [
          'El cliente declara haber recibido el equipo especificado en el presente documento a su entera conformidad, habiendo verificado su correcto',
          'funcionamiento tras la realización del servicio técnico. Toda reparación cuenta con una garantía limitada según los términos establecidos por la',
          'empresa a partir de la fecha de entrega. Esta garantía no cubre daños por mal uso, golpes, humedad o intervención de terceros.',
        ];
      }
    }

    for (const t of terminosLineas.slice(0, 4)) {
      y -= 9;
      page.drawText(t.substring(0, 140), {
        x: 40,
        y,
        size: 6.3,
        font: fontRegular,
        color: textMuted,
      });
    }

    // --- 6. BLOQUE DE FIRMAS (Idéntico a imagen 2) ---
    const signBoxWidth = 200;
    const signY = isRecepcion ? 100 : Math.max(y - 65, 75);

    // Firma del Cliente
    if (firmaBuffer && dto.estadoFirma !== EstadoFirmaDocumento.RECHAZADO_CLIENTE) {
      try {
        const embeddedPng = await pdfDoc.embedPng(firmaBuffer);
        const imgDims = embeddedPng.scaleToFit(140, 48);
        page.drawImage(embeddedPng, {
          x: 40 + (signBoxWidth - imgDims.width) / 2,
          y: signY + 14,
          width: imgDims.width,
          height: imgDims.height,
        });
      } catch (err) {
        this.logger.warn(`No se pudo incrustar PNG en PDF: ${err.message}`);
      }
    } else if (dto.estadoFirma === EstadoFirmaDocumento.RECHAZADO_CLIENTE) {
      page.drawText('CONSTANCIA: CLIENTE SE NEGÓ A FIRMAR', {
        x: 45,
        y: signY + 22,
        size: 7.5,
        font: fontBold,
        color: rgb(0.8, 0.2, 0.2),
      });
    } else {
      page.drawText('(Pendiente de firma manuscrita)', {
        x: 40 + (signBoxWidth - fontOblique.widthOfTextAtSize('(Pendiente de firma manuscrita)', 8)) / 2,
        y: signY + 20,
        size: 8,
        font: fontOblique,
        color: rgb(0.6, 0.6, 0.6),
      });
    }

    page.drawLine({
      start: { x: 40, y: signY + 10 },
      end: { x: 40 + signBoxWidth, y: signY + 10 },
      thickness: 1.2,
      color: borderLight,
    });

    const firmaClienteTitulo = isRecepcion ? 'FIRMA DEL CLIENTE / RECEPTOR' : 'FIRMA DEL CLIENTE';
    page.drawText(firmaClienteTitulo, {
      x: 40 + (signBoxWidth - fontBold.widthOfTextAtSize(firmaClienteTitulo, 7.5)) / 2,
      y: signY - 2,
      size: 7.5,
      font: fontBold,
      color: brandDark,
    });

    page.drawText(`${dto.firmanteNombre.substring(0, 32)}`, {
      x: 40 + (signBoxWidth - fontRegular.widthOfTextAtSize(dto.firmanteNombre.substring(0, 32), 7)) / 2,
      y: signY - 12,
      size: 7,
      font: fontRegular,
      color: textMuted,
    });

    page.drawText(`C.I. / RUC: ${dto.firmanteIdentificacion}`, {
      x: 40 + (signBoxWidth - fontRegular.widthOfTextAtSize(`C.I. / RUC: ${dto.firmanteIdentificacion}`, 6.8)) / 2,
      y: signY - 21,
      size: 6.8,
      font: fontRegular,
      color: textMuted,
    });

    // Firma y Sello Electrónico Autorizado del Responsable del Taller (HC)
    const hcX = width - 40 - signBoxWidth;
    const firmaConfig = await this.firmaElectronicaService.getConfig();

    if (firmaConfig && firmaConfig.activo) {
      // Estampa Visual Oficial FirmaEC
      page.drawRectangle({
        x: hcX,
        y: signY + 12,
        width: signBoxWidth,
        height: 48,
        borderColor: primaryBlue,
        borderWidth: 1.2,
        color: rgb(0.96, 0.98, 1),
      });

      page.drawText('FIRMADO ELECTRÓNICAMENTE (FirmaEC)', {
        x: hcX + 8,
        y: signY + 48,
        size: 7.2,
        font: fontBold,
        color: primaryBlue,
      });

      page.drawText(`Titular: ${(firmaConfig.titularNombre || 'Gerencia General').substring(0, 36)}`, {
        x: hcX + 8,
        y: signY + 38,
        size: 6.8,
        font: fontBold,
        color: textDark,
      });

      page.drawText(`Emisor: ${(firmaConfig.entidadEmisora || 'BCE / Security Data').substring(0, 38)}`, {
        x: hcX + 8,
        y: signY + 28,
        size: 6,
        font: fontRegular,
        color: textMuted,
      });

      page.drawText(`Fecha: ${fechaObj.toLocaleDateString()} | PAdES Criptográfico`, {
        x: hcX + 8,
        y: signY + 18,
        size: 5.8,
        font: fontOblique,
        color: primaryBlue,
      });
    } else {
      // Sello institucional autorizado
      const possibleHdcPaths = [
        path.join(process.cwd(), 'assets', 'firma-autorizada-hdc.png'),
        path.join(process.cwd(), '..', 'Backend', 'assets', 'firma-autorizada-hdc.png'),
        path.join(process.cwd(), '..', 'Frontend', 'public', 'images', 'firma', 'firma-autorizada-hdc.png'),
      ];
      let hdcSignBuffer: Buffer | null = null;
      for (const p of possibleHdcPaths) {
        if (fs.existsSync(p)) {
          try {
            hdcSignBuffer = fs.readFileSync(p);
            break;
          } catch {}
        }
      }

      if (hdcSignBuffer) {
        try {
          const embeddedHdcPng = await pdfDoc.embedPng(hdcSignBuffer);
          const hdcDims = embeddedHdcPng.scaleToFit(140, 48);
          page.drawImage(embeddedHdcPng, {
            x: hcX + (signBoxWidth - hdcDims.width) / 2,
            y: signY + 14,
            width: hdcDims.width,
            height: hdcDims.height,
          });
        } catch (err) {
          this.logger.warn(`No se pudo incrustar firma HDC: ${err.message}`);
        }
      }
    }

    page.drawLine({
      start: { x: hcX, y: signY + 10 },
      end: { x: hcX + signBoxWidth, y: signY + 10 },
      thickness: 1.2,
      color: borderLight,
    });

    const firmaHcTitulo = isRecepcion ? 'RECIBIDO POR (HC)' : 'ENTREGADO POR (CENTRO DE SERVICIO)';
    page.drawText(firmaHcTitulo, {
      x: hcX + (signBoxWidth - fontBold.widthOfTextAtSize(firmaHcTitulo, 7.5)) / 2,
      y: signY - 2,
      size: 7.5,
      font: fontBold,
      color: brandDark,
    });

    const subtextoHc = isRecepcion
      ? 'Hospital del Computador - Gerencia General'
      : 'Hospital del Computador - Gerencia / Taller';
    page.drawText(subtextoHc, {
      x: hcX + (signBoxWidth - fontRegular.widthOfTextAtSize(subtextoHc, 7)) / 2,
      y: signY - 12,
      size: 7,
      font: fontRegular,
      color: textMuted,
    });

    // --- CÓDIGO QR PARA CONSULTA Y SEGUIMIENTO DEL CLIENTE ---
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4000';
      const clientCedula = (orden.client as any)?.cedula || dto.firmanteIdentificacion || '';
      let qrUrl = `${frontendUrl}/consulta?workorder=${encodeURIComponent(orden.workOrderNumber)}&cedula=${encodeURIComponent(clientCedula)}`;

      const tokenPrivado = (dto as any)?.tokenAccesoRaw || (orden as any)?.tokenAccesoRaw;
      if (tokenPrivado && typeof tokenPrivado === 'string' && tokenPrivado.trim() !== '') {
        qrUrl += `&token=${encodeURIComponent(tokenPrivado.trim())}`;
      }


      const qrPngBuffer = await QRCode.toBuffer(qrUrl, {
        type: 'png',
        width: 150,
        margin: 1,
        errorCorrectionLevel: 'M',
      });

      const embeddedQr = await pdfDoc.embedPng(qrPngBuffer);
      const qrSize = 56;
      const qrX = 40 + signBoxWidth + (hcX - (40 + signBoxWidth) - qrSize) / 2;
      const qrY = signY - 8;

      page.drawImage(embeddedQr, {
        x: qrX,
        y: qrY,
        width: qrSize,
        height: qrSize,
      });

      const qrTitle = 'CONSULTA DIGITAL';
      page.drawText(qrTitle, {
        x: qrX + (qrSize - fontBold.widthOfTextAtSize(qrTitle, 5.5)) / 2,
        y: qrY + qrSize + 4,
        size: 5.5,
        font: fontBold,
        color: brandDark,
      });

      const qrDesc = 'Escanee para estado y presupuesto';
      page.drawText(qrDesc, {
        x: qrX + (qrSize - fontRegular.widthOfTextAtSize(qrDesc, 4.5)) / 2,
        y: qrY - 7,
        size: 4.5,
        font: fontRegular,
        color: textMuted,
      });
    } catch (qrErr) {
      this.logger.warn(`No se pudo incrustar código QR en PDF: ${qrErr.message}`);
    }

    // --- 7. PIE DE PÁGINA ---
    const footerY = 20;
    const footerText = 'Centro de Servicio Técnico - Sistema de Gestión de Órdenes ODS - Hospital del Computador';
    page.drawText(footerText, {
      x: 40 + (width - 80 - fontRegular.widthOfTextAtSize(footerText, 6.5)) / 2,
      y: footerY,
      size: 6.5,
      font: fontRegular,
      color: textMuted,
    });
    const auditText = `Documento emitido electrónicamente por Sistema ODS - Hospital del Computador | Validez conforme a Arts. 14 y 15 Ley de Comercio Electrónico`;
    page.drawText(auditText, {
      x: 40 + (width - 80 - fontRegular.widthOfTextAtSize(auditText, 5.8)) / 2,
      y: 11,
      size: 5.8,
      font: fontOblique,
      color: textMuted,
    });

    // --- PÁGINA 2: ANEXO TÉCNICO DE INSPECCIÓN (CUANDO LOS ÍTEMS EXCEDEN EL ESPACIO DE LA PÁGINA 1) ---
    if (needsPage2 && isRecepcion && orden.checklistData) {
      const page2 = pdfDoc.addPage([width, height]);
      let p2Y = height - 40;

      // Encabezado de Anexo
      page2.drawText('HOSPITAL DEL COMPUTADOR - ANEXO TÉCNICO DE INSPECCIÓN', {
        x: 40,
        y: p2Y,
        size: 11,
        font: fontBold,
        color: brandDark,
      });
      p2Y -= 14;

      const subHeader = `Orden: #${orden.workOrderNumber || orden.id} | Cliente: ${clienteNombre} | Equipo: ${tipoEq} - ${marcaMod}`;
      page2.drawText(subHeader.substring(0, 90), {
        x: 40,
        y: p2Y,
        size: 7.8,
        font: fontRegular,
        color: textDark,
      });
      p2Y -= 8;

      page2.drawLine({
        start: { x: 40, y: p2Y },
        end: { x: width - 40, y: p2Y },
        thickness: 1.2,
        color: brandDark,
      });
      p2Y -= 16;

      const checklist = orden.checklistData;

      if (checklist.version === 2) {
        const rec = checklist.inspeccionRecepcion;
        const comp = checklist.inspeccionComplementaria;

        // 1. INSPECCIÓN INICIAL DE RECEPCIÓN
        page2.drawText('1. INSPECCIÓN INICIAL DE RECEPCIÓN (MOSTRADOR)', {
          x: 40,
          y: p2Y,
          size: 8.5,
          font: fontBold,
          color: brandDark,
        });
        p2Y -= 6;
        page2.drawLine({
          start: { x: 40, y: p2Y },
          end: { x: width - 40, y: p2Y },
          thickness: 0.6,
          color: borderLight,
        });
        p2Y -= 12;

        const encStr = formatEncendidoPdf(rec?.estadoEncendido);
        page2.drawText(`Estado de Encendido al Recibir: ${encStr}`, {
          x: 45,
          y: p2Y,
          size: 7.8,
          font: fontBold,
          color: textDark,
        });
        p2Y -= 12;

        if (rec?.observacionGeneral) {
          page2.drawText(`Observación General de Recepción: "${rec.observacionGeneral}"`, {
            x: 45,
            y: p2Y,
            size: 7.2,
            font: fontOblique,
            color: textMuted,
          });
          p2Y -= 12;
        }

        // Inspección Física
        if (rec?.fisica && rec.fisica.length > 0) {
          page2.drawText('A. PUNTOS DE INSPECCIÓN FÍSICA Y ESTÉTICA:', {
            x: 45,
            y: p2Y,
            size: 7.5,
            font: fontBold,
            color: textMuted,
          });
          p2Y -= 11;

          for (const f of rec.fisica) {
            const obs = f.observaciones ? ` — Obs: ${f.observaciones}` : '';
            const line = `  • ${f.item}: [${formatFisicoPdf(f.estado)}]${obs}`;
            page2.drawText(line.substring(0, 100), {
              x: 50,
              y: p2Y,
              size: 7,
              font: fontRegular,
              color: textDark,
            });
            p2Y -= 11;
          }
        }

        // Verificación Funcional
        if (rec?.funcional && rec.funcional.length > 0) {
          p2Y -= 4;
          page2.drawText('B. PRUEBAS DE VERIFICACIÓN FUNCIONAL:', {
            x: 45,
            y: p2Y,
            size: 7.5,
            font: fontBold,
            color: textMuted,
          });
          p2Y -= 11;

          for (const fn of rec.funcional) {
            const obs = fn.observaciones ? ` — Obs: ${fn.observaciones}` : '';
            const line = `  • ${fn.item}: [${formatFuncionalPdf(fn.estado)}]${obs}`;
            page2.drawText(line.substring(0, 100), {
              x: 50,
              y: p2Y,
              size: 7,
              font: fontRegular,
              color: textDark,
            });
            p2Y -= 11;
          }
        }

        // 2. INSPECCIÓN COMPLEMENTARIA POR ESCALAMIENTO
        if (comp) {
          p2Y -= 12;
          page2.drawText('2. INSPECCIÓN TÉCNICA COMPLEMENTARIA (ESCALAMIENTO A ORDEN COMPLETA)', {
            x: 40,
            y: p2Y,
            size: 8.5,
            font: fontBold,
            color: brandDark,
          });
          p2Y -= 6;
          page2.drawLine({
            start: { x: 40, y: p2Y },
            end: { x: width - 40, y: p2Y },
            thickness: 0.6,
            color: borderLight,
          });
          p2Y -= 12;

          const fCompStr = comp.fecha ? new Date(comp.fecha).toLocaleDateString() : 'N/D';
          page2.drawText(`Fecha de escalamiento: ${fCompStr} | Responsable: ${comp.responsableNombre || 'Técnico HDC'}`, {
            x: 45,
            y: p2Y,
            size: 7.5,
            font: fontBold,
            color: textDark,
          });
          p2Y -= 12;

          page2.drawText(`Motivo del Escalamiento: "${comp.motivoEscalamiento}"`, {
            x: 45,
            y: p2Y,
            size: 7.2,
            font: fontOblique,
            color: textDark,
          });
          p2Y -= 12;

          const auth = comp.autorizacionCliente;
          const authTxt = auth?.autorizado
            ? `AUTORIZADO por el cliente vía ${auth.medio || 'Directo'}${auth.detalles ? ` (${auth.detalles})` : ''}`
            : 'PENDIENTE DE AUTORIZACIÓN DEL CLIENTE';
          page2.drawText(`Estado de Autorización: ${authTxt}`.substring(0, 95), {
            x: 45,
            y: p2Y,
            size: 7.2,
            font: fontBold,
            color: auth?.autorizado ? rgb(0.1, 0.6, 0.2) : rgb(0.8, 0.4, 0),
          });
          p2Y -= 12;

          if (comp.fisica && comp.fisica.length > 0) {
            for (const f of comp.fisica) {
              const obs = f.observaciones ? ` — Obs: ${f.observaciones}` : '';
              page2.drawText(`  • [Físico Taller] ${f.item}: [${formatFisicoPdf(f.estado)}]${obs}`.substring(0, 100), {
                x: 50,
                y: p2Y,
                size: 7,
                font: fontRegular,
                color: textDark,
              });
              p2Y -= 11;
            }
          }

          if (comp.funcional && comp.funcional.length > 0) {
            for (const fn of comp.funcional) {
              const obs = fn.observaciones ? ` — Obs: ${fn.observaciones}` : '';
              page2.drawText(`  • [Funcional Taller] ${fn.item}: [${formatFuncionalPdf(fn.estado)}]${obs}`.substring(0, 100), {
                x: 50,
                y: p2Y,
                size: 7,
                font: fontRegular,
                color: textDark,
              });
              p2Y -= 11;
            }
          }
        }
      } else if (Array.isArray(checklist.results)) {
        // Formato legado V1 completo
        page2.drawText('LISTADO COMPLETO DE PUNTOS EVALUADOS (FORMATO HISTÓRICO):', {
          x: 40,
          y: p2Y,
          size: 8.5,
          font: fontBold,
          color: brandDark,
        });
        p2Y -= 6;
        page2.drawLine({
          start: { x: 40, y: p2Y },
          end: { x: width - 40, y: p2Y },
          thickness: 0.6,
          color: borderLight,
        });
        p2Y -= 12;

        for (const item of checklist.results) {
          const obs = item.observaciones ? ` | Obs: ${item.observaciones}` : '';
          const line = `• ${item.item}: Funcionalidad: ${item.funcional || 'OK'} | Estética: ${item.estetica || 'OK'}${obs}`;
          page2.drawText(line.substring(0, 100), {
            x: 45,
            y: p2Y,
            size: 7.2,
            font: fontRegular,
            color: textDark,
          });
          p2Y -= 12;
        }
      }

      // Pie de página de anexo
      page2.drawText('Anexo técnico emitido conforme a la Orden de Servicio. Válido como parte integral del acta de recepción.', {
        x: 40 + (width - 80 - fontOblique.widthOfTextAtSize('Anexo técnico emitido conforme a la Orden de Servicio. Válido como parte integral del acta de recepción.', 6.2)) / 2,
        y: 20,
        size: 6.2,
        font: fontOblique,
        color: textMuted,
      });
    }

    return await pdfDoc.save();
  }

  /**
   * Genera el documento PDF canónico de Aceptación o Rechazo de Presupuesto
   * con valor probatorio, desglose técnico de ítems, firma manuscrita digitalizada y hash SHA-256.
   */
  private async generarPdfPresupuestoCanonico(
    orden: Order,
    dto: FirmarDocumentoDto,
    operador: User,
    firmaBuffer: Buffer | null,
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 estándar
    const { width, height } = page.getSize();

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const isAceptado = dto.tipoDocumento === TipoDocumentoOrden.AUTORIZACION_PRESUPUESTO;
    const brandDark = rgb(0.06, 0.09, 0.16); // #0f172a
    const textDark = rgb(0.12, 0.16, 0.22); // #1f2937
    const textMuted = rgb(0.42, 0.46, 0.53); // #6b7280
    const borderLight = rgb(0.85, 0.88, 0.92); // #e2e8f0
    const primaryBlue = rgb(0.12, 0.45, 0.88);
    const accentGreen = rgb(0.05, 0.6, 0.3);
    const accentRed = rgb(0.85, 0.2, 0.2);
    const bgLight = rgb(0.97, 0.98, 0.99);

    let y = height - 40;

    // Cargar configuración corporativa
    let config: any = null;
    try {
      config = await this.configuracionSistemaService.obtenerConfiguracion();
    } catch (err) {
      this.logger.warn(`Configuración corporativa no cargada para PDF presupuesto: ${err.message}`);
    }

    // 1. Logo corporativo
    let logoEmbedded = false;
    const logoPaths = [
      path.join(process.cwd(), 'assets', 'logo_hdc.png'),
      path.join(process.cwd(), '..', 'Backend', 'assets', 'logo_hdc.png'),
    ];
    for (const lp of logoPaths) {
      if (fs.existsSync(lp)) {
        try {
          const logoBuf = fs.readFileSync(lp);
          const embLogo = await pdfDoc.embedPng(logoBuf);
          const dims = embLogo.scaleToFit(150, 40);
          page.drawImage(embLogo, {
            x: 40,
            y: y - dims.height,
            width: dims.width,
            height: dims.height,
          });
          logoEmbedded = true;
          break;
        } catch {}
      }
    }

    if (!logoEmbedded) {
      const nombreEmpresa = config?.nombreComercial || config?.nombreEmpresa || 'Hospital del Computador';
      page.drawText(nombreEmpresa, {
        x: 40,
        y: y - 20,
        size: 16,
        font: fontBold,
        color: brandDark,
      });
    }

    // 2. Recuadro del Documento (Top Right)
    const boxWidth = 230;
    const boxHeight = 52;
    const boxX = width - 40 - boxWidth;
    const boxY = y - boxHeight + 4;

    page.drawRectangle({
      x: boxX,
      y: boxY,
      width: boxWidth,
      height: boxHeight,
      borderWidth: 1.8,
      borderColor: isAceptado ? accentGreen : accentRed,
      color: rgb(1, 1, 1),
    });

    const docTitle = isAceptado ? 'ACTA DE AUTORIZACIÓN DE PRESUPUESTO' : 'ACTA DE RECHAZO DE PRESUPUESTO';
    page.drawText(docTitle, {
      x: boxX + (boxWidth - fontBold.widthOfTextAtSize(docTitle, 6.8)) / 2,
      y: boxY + 36,
      size: 6.8,
      font: fontBold,
      color: isAceptado ? accentGreen : accentRed,
    });

    const orderNumStr = `#${orden.workOrderNumber}`;
    page.drawText(orderNumStr, {
      x: boxX + (boxWidth - fontBold.widthOfTextAtSize(orderNumStr, 15)) / 2,
      y: boxY + 18,
      size: 15,
      font: fontBold,
      color: brandDark,
    });

    const versionStr = `VERSIÓN PRESUPUESTO: v${orden.presupuesto?.version || 1}`;
    page.drawText(versionStr, {
      x: boxX + (boxWidth - fontBold.widthOfTextAtSize(versionStr, 6.5)) / 2,
      y: boxY + 6,
      size: 6.5,
      font: fontBold,
      color: textMuted,
    });

    // Contacto y fecha
    y -= 55;
    const fechaObj = new Date();
    const fechaText = `EMISIÓN: ${fechaObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()} - ${fechaObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    page.drawText(fechaText, {
      x: width - 40 - fontBold.widthOfTextAtSize(fechaText, 6.8),
      y: y + 8,
      size: 6.8,
      font: fontBold,
      color: brandDark,
    });

    const dirText = config?.direccion ? `Dir: ${config.direccion.toUpperCase()}` : 'Dir: Veloz, entre Diego de Ibarra y Uruguay';
    page.drawText(dirText.substring(0, 55), {
      x: 40,
      y: y + 8,
      size: 6.8,
      font: fontRegular,
      color: textMuted,
    });

    y -= 12;

    // 3. Bloque de Datos: Cliente, Autorizante y Equipo
    page.drawRectangle({
      x: 40,
      y: y - 82,
      width: width - 80,
      height: 82,
      borderWidth: 1,
      borderColor: borderLight,
      color: bgLight,
    });

    const clienteNombre = orden.client
      ? `${orden.client.nombre || ''} ${orden.client.apellido || ''}`.trim()
      : 'Cliente General';
    const clienteCedula = (orden.client as any)?.cedula || 'N/D';
    const clienteTel = orden.client?.telefono || 'N/D';

    const eqTipo = orden.equipo?.tipoEquipo?.nombre || 'Equipo';
    const eqMarca = orden.equipo?.marca?.nombre || 'Generico';
    const eqMod = orden.equipo?.modelo?.nombre || '';
    const eqSerie = orden.equipo?.numeroSerie || 'S/N';

    page.drawText('DATOS DE IDENTIFICACIÓN Y EQUIPO ASOCIADO', {
      x: 50,
      y: y - 14,
      size: 7.5,
      font: fontBold,
      color: brandDark,
    });

    // Columna 1: Titular
    page.drawText(`Cliente Titular: ${clienteNombre}`, { x: 50, y: y - 28, size: 7.2, font: fontRegular, color: textDark });
    page.drawText(`C.I. / RUC Titular: ${clienteCedula} | Teléfono: ${clienteTel}`, { x: 50, y: y - 40, size: 7.2, font: fontRegular, color: textDark });

    // Columna 1 bis: Autorizante real
    const firmanteNombre = dto.firmanteNombre || clienteNombre;
    const firmanteCedula = dto.firmanteIdentificacion || clienteCedula;
    const esTitular = firmanteCedula === clienteCedula;
    page.drawText(`Persona que Autoriza: ${firmanteNombre} (${esTitular ? 'Titular' : 'Tercero / Familiar Autorizado'})`, {
      x: 50,
      y: y - 52,
      size: 7.2,
      font: fontBold,
      color: esTitular ? brandDark : primaryBlue,
    });
    page.drawText(`C.I. Autorizante: ${firmanteCedula}`, { x: 50, y: y - 64, size: 7.2, font: fontRegular, color: textDark });

    // Columna 2: Equipo
    page.drawText(`Equipo: ${eqTipo} - ${eqMarca} ${eqMod}`, { x: 330, y: y - 28, size: 7.2, font: fontRegular, color: textDark });
    page.drawText(`Número de Serie: ${eqSerie}`, { x: 330, y: y - 40, size: 7.2, font: fontBold, color: brandDark });
    page.drawText(`Técnico Responsable: ${orden.technician ? `${orden.technician.nombre} ${orden.technician.apellido || ''}`.trim() : 'Asignado a Taller'}`, {
      x: 330,
      y: y - 52,
      size: 7.2,
      font: fontRegular,
      color: textMuted,
    });

    y -= 96;

    // 4. Tabla de Ítems del Presupuesto
    page.drawText('DESGLOSE DETALLADO DEL PRESUPUESTO TÉCNICO', {
      x: 40,
      y: y,
      size: 8,
      font: fontBold,
      color: brandDark,
    });
    y -= 14;

    // Cabecera de Tabla
    const colXItem = 45;
    const colXCant = 360;
    const colXPre = 425;
    const colXTot = 505;

    page.drawRectangle({
      x: 40,
      y: y - 16,
      width: width - 80,
      height: 16,
      color: brandDark,
    });

    page.drawText('DESCRIPCIÓN / REPUESTO / SERVICIO', { x: colXItem, y: y - 11, size: 6.8, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('CANT.', { x: colXCant, y: y - 11, size: 6.8, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('P. UNITARIO', { x: colXPre, y: y - 11, size: 6.8, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('TOTAL', { x: colXTot, y: y - 11, size: 6.8, font: fontBold, color: rgb(1, 1, 1) });

    y -= 18;

    const items = orden.presupuesto?.detallesPresupuestoItems || [];
    let subtotalCalculado = 0;

    for (let i = 0; i < items.length && i < 12; i++) {
      const it = items[i];
      const cant = Number(it.cantidad) || 1;
      const precio = Number(it.precioUnitario) || 0;
      const totalLinea = cant * precio;
      subtotalCalculado += totalLinea;

      const isEven = i % 2 === 0;
      if (isEven) {
        page.drawRectangle({
          x: 40,
          y: y - 14,
          width: width - 80,
          height: 14,
          color: bgLight,
        });
      }

      const itemName = (it.parte?.nombre || 'Servicio / Repuesto').substring(0, 52);
      page.drawText(itemName, { x: colXItem, y: y - 10, size: 7, font: fontRegular, color: textDark });
      page.drawText(String(cant), { x: colXCant + 6, y: y - 10, size: 7, font: fontRegular, color: textDark });
      page.drawText(`$${precio.toFixed(2)}`, { x: colXPre + 6, y: y - 10, size: 7, font: fontRegular, color: textDark });
      page.drawText(`$${totalLinea.toFixed(2)}`, { x: colXTot + 6, y: y - 10, size: 7, font: fontBold, color: brandDark });

      y -= 15;
    }

    if (items.length === 0) {
      page.drawText('No se registraron ítems desglosados en este presupuesto.', {
        x: colXItem,
        y: y - 10,
        size: 7,
        font: fontOblique,
        color: textMuted,
      });
      y -= 18;
    }

    // Totales
    const iva = subtotalCalculado * 0.15; // IVA 15% Ecuador
    const totalConIva = subtotalCalculado + iva;

    page.drawLine({
      start: { x: colXCant - 10, y: y },
      end: { x: width - 40, y: y },
      thickness: 1,
      color: borderLight,
    });
    y -= 12;

    page.drawText('SUBTOTAL:', { x: colXCant, y: y, size: 7.2, font: fontRegular, color: textDark });
    page.drawText(`$${subtotalCalculado.toFixed(2)}`, { x: colXTot + 6, y: y, size: 7.2, font: fontRegular, color: textDark });
    y -= 12;

    page.drawText('IVA (15%):', { x: colXCant, y: y, size: 7.2, font: fontRegular, color: textDark });
    page.drawText(`$${iva.toFixed(2)}`, { x: colXTot + 6, y: y, size: 7.2, font: fontRegular, color: textDark });
    y -= 14;

    // Total final enmarcado
    page.drawRectangle({
      x: colXCant - 10,
      y: y - 6,
      width: width - 40 - (colXCant - 10),
      height: 20,
      color: isAceptado ? rgb(0.92, 0.98, 0.94) : rgb(0.99, 0.93, 0.93),
      borderColor: isAceptado ? accentGreen : accentRed,
      borderWidth: 1.2,
    });

    const totLabel = isAceptado ? 'TOTAL AUTORIZADO:' : 'TOTAL RECHAZADO:';
    page.drawText(totLabel, { x: colXCant, y: y, size: 8, font: fontBold, color: isAceptado ? accentGreen : accentRed });
    page.drawText(`$${totalConIva.toFixed(2)}`, { x: colXTot + 4, y: y, size: 9, font: fontBold, color: brandDark });

    y -= 30;

    // 5. Declaración de Consentimiento Legal
    page.drawRectangle({
      x: 40,
      y: y - 50,
      width: width - 80,
      height: 50,
      color: bgLight,
      borderColor: borderLight,
      borderWidth: 1,
    });

    page.drawText('DECLARACIÓN EXPRESA DE CONFORMIDAD Y AUTORIZACIÓN', {
      x: 48,
      y: y - 12,
      size: 6.8,
      font: fontBold,
      color: brandDark,
    });

    const textoDeclaracion = isAceptado
      ? 'El autorizante declara haber sido informado del peritaje técnico, repuestos requeridos, tiempos estimados y costos totales. En ejercicio libre de su voluntad, AUTORIZA la intervención técnica y suministro de partes descritas, comprometiéndose al pago de los valores aprobados conforme a los términos de servicio de Hospital del Computador.'
      : 'El autorizante manifiesta de forma voluntaria su decisión de NO ACEPTAR el presupuesto formulado para su equipo, solicitando el cierre de la orden en el estado actual y autorizando la devolución del equipo bajo las condiciones de entrega del taller.';

    page.drawText(textoDeclaracion.substring(0, 195), { x: 48, y: y - 24, size: 6.2, font: fontRegular, color: textDark });
    page.drawText(textoDeclaracion.substring(195, 390), { x: 48, y: y - 34, size: 6.2, font: fontRegular, color: textDark });

    y -= 75;

    // 6. Bloque de Firmas
    const signBoxWidth = 210;
    const signY = y - 48;

    // A. Firma del Autorizante (Izquierda)
    page.drawRectangle({
      x: 40,
      y: signY,
      width: signBoxWidth,
      height: 52,
      borderColor: borderLight,
      borderWidth: 1,
      color: rgb(1, 1, 1),
    });

    if (firmaBuffer && dto.estadoFirma !== EstadoFirmaDocumento.RECHAZADO_CLIENTE) {
      try {
        const embPng = await pdfDoc.embedPng(firmaBuffer);
        const dims = embPng.scaleToFit(140, 42);
        page.drawImage(embPng, {
          x: 40 + (signBoxWidth - dims.width) / 2,
          y: signY + 5,
          width: dims.width,
          height: dims.height,
        });
      } catch (err) {
        this.logger.warn(`No se pudo incrustar firma manuscrita en PDF de presupuesto: ${err.message}`);
      }
    } else {
      page.drawText('(Pendiente de firma en pantalla táctil)', {
        x: 40 + (signBoxWidth - fontOblique.widthOfTextAtSize('(Pendiente de firma en pantalla táctil)', 7)) / 2,
        y: signY + 20,
        size: 7,
        font: fontOblique,
        color: textMuted,
      });
    }

    page.drawLine({
      start: { x: 40, y: signY - 4 },
      end: { x: 40 + signBoxWidth, y: signY - 4 },
      thickness: 1.2,
      color: borderLight,
    });

    const firmaAutTitulo = isAceptado ? 'FIRMA DEL AUTORIZANTE / CLIENTE' : 'FIRMA DEL CLIENTE QUE RECHAZA';
    page.drawText(firmaAutTitulo, {
      x: 40 + (signBoxWidth - fontBold.widthOfTextAtSize(firmaAutTitulo, 7)) / 2,
      y: signY - 14,
      size: 7,
      font: fontBold,
      color: brandDark,
    });
    page.drawText(firmanteNombre.substring(0, 32), {
      x: 40 + (signBoxWidth - fontRegular.widthOfTextAtSize(firmanteNombre.substring(0, 32), 6.5)) / 2,
      y: signY - 23,
      size: 6.5,
      font: fontRegular,
      color: textMuted,
    });
    page.drawText(`C.I. / RUC: ${firmanteCedula}`, {
      x: 40 + (signBoxWidth - fontRegular.widthOfTextAtSize(`C.I. / RUC: ${firmanteCedula}`, 6.5)) / 2,
      y: signY - 32,
      size: 6.5,
      font: fontRegular,
      color: textMuted,
    });
    page.drawText('Modalidad: Firma Manuscrita Digitalizada en Pantalla Táctil', {
      x: 40 + (signBoxWidth - fontOblique.widthOfTextAtSize('Modalidad: Firma Manuscrita Digitalizada en Pantalla Táctil', 5.5)) / 2,
      y: signY - 40,
      size: 5.5,
      font: fontOblique,
      color: primaryBlue,
    });

    // B. Sello y Firma del Taller (Derecha)
    const hcX = width - 40 - signBoxWidth;
    page.drawRectangle({
      x: hcX,
      y: signY,
      width: signBoxWidth,
      height: 52,
      borderColor: borderLight,
      borderWidth: 1,
      color: rgb(1, 1, 1),
    });

    const firmaConfig = await this.firmaElectronicaService.getConfig();
    if (firmaConfig && firmaConfig.activo) {
      page.drawText('FIRMADO ELECTRÓNICAMENTE (FirmaEC)', { x: hcX + 10, y: signY + 36, size: 7, font: fontBold, color: primaryBlue });
      page.drawText(`Titular: ${(firmaConfig.titularNombre || 'Gerente General').substring(0, 34)}`, { x: hcX + 10, y: signY + 24, size: 6.5, font: fontBold, color: textDark });
      page.drawText(`Fecha: ${fechaObj.toLocaleDateString()} | PAdES Criptográfico`, { x: hcX + 10, y: signY + 12, size: 5.8, font: fontOblique, color: primaryBlue });
    } else {
      page.drawText('HOSPITAL DEL COMPUTADOR', { x: hcX + (signBoxWidth - fontBold.widthOfTextAtSize('HOSPITAL DEL COMPUTADOR', 8)) / 2, y: signY + 28, size: 8, font: fontBold, color: brandDark });
      page.drawText('CENTRO TÉCNICO AUTORIZADO', { x: hcX + (signBoxWidth - fontRegular.widthOfTextAtSize('CENTRO TÉCNICO AUTORIZADO', 6.5)) / 2, y: signY + 16, size: 6.5, font: fontRegular, color: textMuted });
    }

    page.drawLine({
      start: { x: hcX, y: signY - 4 },
      end: { x: hcX + signBoxWidth, y: signY - 4 },
      thickness: 1.2,
      color: borderLight,
    });

    const staffName = operador ? `${operador.nombre || ''} ${operador.apellido || ''}`.trim() : 'Recepción';
    page.drawText('REGISTRADO Y CERTIFICADO POR', {
      x: hcX + (signBoxWidth - fontBold.widthOfTextAtSize('REGISTRADO Y CERTIFICADO POR', 7)) / 2,
      y: signY - 14,
      size: 7,
      font: fontBold,
      color: brandDark,
    });
    page.drawText(staffName.substring(0, 32), {
      x: hcX + (signBoxWidth - fontRegular.widthOfTextAtSize(staffName.substring(0, 32), 6.5)) / 2,
      y: signY - 23,
      size: 6.5,
      font: fontRegular,
      color: textMuted,
    });
    page.drawText('Hospital del Computador - Taller Técnico', {
      x: hcX + (signBoxWidth - fontRegular.widthOfTextAtSize('Hospital del Computador - Taller Técnico', 6.2)) / 2,
      y: signY - 32,
      size: 6.2,
      font: fontRegular,
      color: textMuted,
    });

    // 7. Pie de Página de Auditoría
    const auditY = 20;
    const auditText = `Documento de valor probatorio emitido electrónicamente por Sistema ODS - Hospital del Computador | Conforme Arts. 14 y 15 Ley de Comercio Electrónico`;
    page.drawText(auditText, {
      x: 40 + (width - 80 - fontRegular.widthOfTextAtSize(auditText, 5.8)) / 2,
      y: auditY,
      size: 5.8,
      font: fontRegular,
      color: textMuted,
    });

    return await pdfDoc.save();
  }
}
