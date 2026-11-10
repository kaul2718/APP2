import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
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
import { ActivacionCuenta } from '../auth/entities/activacion-cuenta.entity';
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
/**
 * Divide un texto en líneas que no superen maxWidth, respetando saltos de línea explícitos (\n, \r\n, \n)
 * y dividiendo por palabras completas con cálculo exacto en puntos tipográficos.
 */
function wrapText(
  text: string,
  font: any,
  fontSize: number,
  maxWidth: number,
): string[] {
  if (!text || typeof text !== 'string') return [];

  const normalizedText = text
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\n/g, '\n')
    .replace(/\r/g, '\n');

  const paragraphs = normalizedText.split('\n');
  const resultLines: string[] = [];

  for (const paragraph of paragraphs) {
    const trimmedPara = paragraph.trim();
    if (!trimmedPara) continue;

    const words = trimmedPara.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(candidate, fontSize);

      if (width <= maxWidth) {
        currentLine = candidate;
      } else {
        if (currentLine) {
          resultLines.push(currentLine);
          if (font.widthOfTextAtSize(word, fontSize) > maxWidth) {
            let part = '';
            for (const char of word) {
              if (font.widthOfTextAtSize(`${part}${char}...`, fontSize) <= maxWidth) {
                part += char;
              } else break;
            }
            resultLines.push(`${part}...`);
            currentLine = '';
          } else {
            currentLine = word;
          }
        } else {
          let part = '';
          for (const char of word) {
            if (font.widthOfTextAtSize(`${part}${char}...`, fontSize) <= maxWidth) {
              part += char;
            } else break;
          }
          resultLines.push(`${part}...`);
          currentLine = '';
        }
      }
    }

    if (currentLine) {
      resultLines.push(currentLine);
    }
  }

  return resultLines;
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
    @InjectRepository(ActivacionCuenta)
    private readonly activacionRepository: Repository<ActivacionCuenta>,
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
    tokenActivacion?: string,
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
      tokenActivacion,
    };

    const operador =
      (await this.userRepository.findOne({ where: { id: operadorId } })) ||
      ({ nombre: 'Recepción', apellido: 'HDC' } as User);

    const pdfBytes = await this.generarPdfCanonico(orden, dto, operador, null);
    return Buffer.from(pdfBytes);
  }

  /**
   * Obtiene el buffer PDF para impresión de ticket térmico POS (80 mm).
   * Comprobante simplificado para impresoras de rollo continuo.
   * Coexiste con la ODS A4 completa y no altera firmas ni almacenamiento histórico.
   */
  async obtenerTicketTermicoBuffer(
    orderId: number,
    operadorId: number,
    tokenActivacion?: string,
  ): Promise<Buffer> {
    const orden = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: [
        'client',
        'equipo',
        'equipo.tipoEquipo',
        'equipo.marca',
        'equipo.modelo',
        'estadoOrden',
      ],
    });

    if (!orden) {
      throw new NotFoundException(`Orden #${orderId} no encontrada.`);
    }

    const operador =
      (await this.userRepository.findOne({ where: { id: operadorId } })) ||
      ({ nombre: 'Recepción', apellido: 'HDC' } as User);

    const pdfBytes = await this.generarPdfTicketTermico(orden, operador, tokenActivacion);
    return Buffer.from(pdfBytes);
  }

  /**
   * Genera el documento PDF de ticket térmico POS con ancho estándar de 80 mm (226.77 pt)
   * y altura calculada dinámicamente según el contenido exacto.
   */
  private async generarPdfTicketTermico(
    orden: Order,
    operador: User,
    tokenActivacion?: string,
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const ticketWidth = 226.77; // 80 mm en puntos tipográficos (72 DPI)
    const margin = 14;
    const usableWidth = ticketWidth - margin * 2; // ~198.77 pt

    const textDark = rgb(0.12, 0.12, 0.12);
    const textMuted = rgb(0.42, 0.42, 0.42);
    const lineGray = rgb(0.72, 0.72, 0.72);

    // 1. Configuración del establecimiento
    let config: any = null;
    try {
      config = await this.configuracionSistemaService.obtenerConfiguracion();
    } catch (err) {
      this.logger.warn(`No se pudo cargar configuración corporativa para ticket: ${err.message}`);
    }

    const nombreEmpresa = (config?.nombreComercial || config?.nombreEmpresa || 'HOSPITAL DEL COMPUTADOR').toUpperCase();
    const ciudadPais = config?.ciudad ? `${config.ciudad}, Ecuador` : 'Riobamba, Ecuador';
    const tels = [config?.telefono, config?.whatsapp].filter(Boolean).join(' · ');

    // 2. Datos de la Orden
    const orderNumStr = `#${String(orden.workOrderNumber || orden.id).padStart(5, '0')}`;
    const fechaCreacion = orden.createdAt ? new Date(orden.createdAt) : new Date();
    const fechaStr = fechaCreacion.toLocaleDateString('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const horaStr = fechaCreacion.toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const fechaHoraStr = `${fechaStr} · ${horaStr}`;

    const clienteNombre = (orden.client
      ? `${orden.client.nombre || ''} ${orden.client.apellido || ''}`.trim()
      : 'Cliente General') || 'Cliente';
    const clienteCedula = (orden.client as any)?.cedula || '';

    const eqTipo = orden.equipo?.tipoEquipo?.nombre || 'Equipo';
    const eqMarca = orden.equipo?.marca?.nombre || '';
    const eqMod = orden.equipo?.modelo?.nombre || '';
    const equipoStr = [eqTipo, eqMarca, eqMod].filter(Boolean).join(' ');
    const serieStr = orden.equipo?.numeroSerie || 'S/N';
    const estadoStr = orden.estadoOrden?.nombre || 'Recepción';
    const motivoStr = orden.problemaReportado || '';

    // 3. Resolución de Activación / QR
    const frontendUrl =
      process.env.FRONTEND_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://elhospitaldelcomputador.com'
        : 'http://localhost:4000');
    const clientId = orden.client?.id;

    let tienePassword = false;
    if (clientId) {
      const clientWithPass = await this.userRepository.findOne({
        where: { id: clientId },
        select: ['id', 'password'],
      });
      tienePassword = Boolean(clientWithPass?.password);
    }

    let qrUrl: string | null = null;
    let qrTitle = 'ESCANEE PARA ACCEDER';
    let qrSub1 = 'Escanee para crear su contraseña';
    let qrSub2 = `Usuario: ${clienteCedula || 'su cédula'}`;
    let qrSubExtra: string | null = null;
    let tieneQr = true;

    const rawToken = tokenActivacion || (orden as any)?.tokenActivacion || (orden as any)?.activacion?.token;

    if (tienePassword) {
      qrUrl = `${frontendUrl}/signin`;
      qrTitle = 'CONSULTA DIGITAL';
      qrSub1 = 'Consulte el estado de su orden';
      qrSub2 = `Usuario: ${clienteCedula || 'su cédula'}`;
      qrSubExtra = null;
      tieneQr = true;
    } else {
      let tokenValido = false;
      if (rawToken && typeof rawToken === 'string' && rawToken.trim() !== '' && clientId) {
        const tokenHash = crypto
          .createHash('sha256')
          .update(rawToken.trim())
          .digest('hex');

        const actRegistro = await this.activacionRepository.findOne({
          where: { tokenHash, usuarioId: clientId },
        });

        if (
          actRegistro &&
          !actRegistro.usedAt &&
          !actRegistro.revokedAt &&
          new Date() < new Date(actRegistro.expiresAt)
        ) {
          tokenValido = true;
        } else {
          this.logger.warn(
            `Token de activación provisto para ODS #${orden.workOrderNumber || orden.id} no es válido, expiró o está revocado. Se omitirá del ticket térmico.`,
          );
        }
      }

      if (tokenValido) {
        qrUrl = `${frontendUrl}/activar-cuenta?token=${encodeURIComponent(rawToken.trim())}`;
        qrTitle = 'ACTIVACIÓN DE CUENTA';
        qrSub1 = 'Escanee para crear su contraseña';
        qrSub2 = `Usuario: ${clienteCedula || 'su cédula'}`;
        qrSubExtra = 'Enlace temporal (vigente 48h)';
        tieneQr = true;
      } else {
        qrUrl = `${frontendUrl}/activar-cuenta`;
        qrTitle = 'ACTIVACIÓN DE CUENTA';
        qrSub1 = 'Escanee para activar su cuenta';
        qrSub2 = `Usuario: ${clienteCedula || 'su cédula'}`;
        qrSubExtra = 'Solicite enlace en recepción';
        tieneQr = true;
      }
    }

    const qrSize = 115;
    let embeddedQr: any = null;
    if (tieneQr && qrUrl) {
      const qrPngBuffer = await QRCode.toBuffer(qrUrl, {
        type: 'png',
        width: 250,
        margin: 1,
        errorCorrectionLevel: 'M',
      });
      embeddedQr = await pdfDoc.embedPng(qrPngBuffer);
    }

    // 4. Preparación de filas con wrapping de texto
    interface TicketRow {
      label: string;
      lines: string[];
    }
    const rawRows: { label: string; text: string }[] = [
      { label: 'Cliente:', text: clienteNombre },
    ];
    if (clienteCedula) {
      rawRows.push({ label: 'C.I. / RUC:', text: clienteCedula });
    }
    rawRows.push({ label: 'Equipo:', text: equipoStr });
    rawRows.push({ label: 'Serie:', text: serieStr });
    if (motivoStr) {
      rawRows.push({ label: 'Motivo:', text: motivoStr });
    }
    rawRows.push({ label: 'Estado:', text: estadoStr });

    const preparedRows: TicketRow[] = rawRows.map((r) => {
      const labelW = fontBold.widthOfTextAtSize(r.label, 8) + 4;
      const valueW = usableWidth - labelW;
      const lines = wrapText(r.text, fontRegular, 8, valueW);
      return {
        label: r.label,
        lines: lines.length > 0 ? lines : ['N/D'],
      };
    });

    let dataSectionHeight = 0;
    for (const row of preparedRows) {
      dataSectionHeight += row.lines.length * 10.5 + 3;
    }

    // 5. Cálculo dinámico exacto de altura total con optimización de espacios térmicos
    const topMargin = 14;
    const iconBlockH = 20; // icono (11) + gap (9)
    const companyBlockH = 16;
    const cityBlockH = 12;
    const telsBlockH = tels ? 12 : 0;
    const sep1H = 11;

    const odsTitleBlockH = 15;
    const odsNumBlockH = 23;
    const odsDateBlockH = 14;
    const sep2H = 11;

    const sep3H = 11;

    // Altura del bloque de acceso/activación ajustada automáticamente:
    // Si tiene QR: altura de QR + gap + textos
    // Si NO tiene QR (contingencia): solo bloque informativo sin QR (ahorro térmico de ~115 pt)
    const qrBlockH = tieneQr
      ? qrSize + 8 + 16 + 13 + 13 + (qrSubExtra ? 13 : 0)
      : 16 + 14 + 14 + (qrSubExtra ? 14 : 0) + 4;
    const sep4H = 11;

    const footerBlockH = 11 + 11 + 14;
    const bottomMargin = 13;

    const totalHeight = Math.ceil(
      topMargin +
      iconBlockH +
      companyBlockH +
      cityBlockH +
      telsBlockH +
      sep1H +
      odsTitleBlockH +
      odsNumBlockH +
      odsDateBlockH +
      sep2H +
      dataSectionHeight +
      sep3H +
      qrBlockH +
      sep4H +
      footerBlockH +
      bottomMargin,
    );

    // Creamos la página con el tamaño exacto continuo (80 mm x totalHeight)
    const page = pdfDoc.addPage([ticketWidth, totalHeight]);
    let curY = totalHeight - topMargin;

    // Helper: línea horizontal discontinua
    const drawDivider = (yPos: number) => {
      const dash = 2.5;
      const space = 2;
      let curr = margin;
      while (curr < ticketWidth - margin) {
        const next = Math.min(curr + dash, ticketWidth - margin);
        page.drawLine({
          start: { x: curr, y: yPos },
          end: { x: next, y: yPos },
          thickness: 0.6,
          color: lineGray,
        });
        curr += dash + space;
      }
    };

    // Helper: centrar texto
    const drawCenteredText = (
      text: string,
      font: any,
      size: number,
      color: any,
      yPos: number,
    ) => {
      const tw = font.widthOfTextAtSize(text, size);
      const tx = (ticketWidth - tw) / 2;
      page.drawText(text, { x: tx, y: yPos, size, font, color });
    };

    // A. Icono de monitor centrado
    const compW = 16;
    const compH = 11;
    const compX = (ticketWidth - compW) / 2;
    page.drawRectangle({
      x: compX,
      y: curY - compH,
      width: compW,
      height: compH,
      borderWidth: 1,
      borderColor: textDark,
      color: rgb(1, 1, 1),
    });
    page.drawLine({
      start: { x: compX + 4, y: curY - compH - 2 },
      end: { x: compX + compW - 4, y: curY - compH - 2 },
      thickness: 1,
      color: textDark,
    });
    curY -= iconBlockH;

    // B. Encabezado
    drawCenteredText(nombreEmpresa, fontBold, 9.5, textDark, curY - 8);
    curY -= companyBlockH;

    drawCenteredText(ciudadPais, fontRegular, 7.5, textMuted, curY - 6);
    curY -= cityBlockH;

    if (tels) {
      drawCenteredText(tels, fontRegular, 6.8, textMuted, curY - 6);
      curY -= telsBlockH;
    }

    drawDivider(curY);
    curY -= sep1H;

    // C. Orden de Servicio
    drawCenteredText('ORDEN DE SERVICIO', fontBold, 7.5, textMuted, curY - 6);
    curY -= odsTitleBlockH;

    drawCenteredText(orderNumStr, fontBold, 17, textDark, curY - 13);
    curY -= odsNumBlockH;

    drawCenteredText(fechaHoraStr, fontRegular, 7.5, textMuted, curY - 6);
    curY -= odsDateBlockH;

    drawDivider(curY);
    curY -= sep2H;

    // D. Filas de datos
    for (const row of preparedRows) {
      const labelW = fontBold.widthOfTextAtSize(row.label, 8) + 4;
      const valX = margin + labelW;

      page.drawText(row.label, {
        x: margin,
        y: curY - 7,
        size: 8,
        font: fontBold,
        color: textDark,
      });

      let lineY = curY - 7;
      for (let i = 0; i < row.lines.length; i++) {
        page.drawText(row.lines[i], {
          x: valX,
          y: lineY,
          size: 8,
          font: fontRegular,
          color: textDark,
        });
        lineY -= 10.5;
      }
      curY -= row.lines.length * 10.5 + 3;
    }

    drawDivider(curY);
    curY -= sep3H;

    // E. Código QR y/o Aviso de Contingencia
    if (tieneQr && embeddedQr) {
      const qrX = (ticketWidth - qrSize) / 2;
      page.drawImage(embeddedQr, {
        x: qrX,
        y: curY - qrSize,
        width: qrSize,
        height: qrSize,
      });
      curY -= (qrSize + 8);

      drawCenteredText(qrTitle, fontBold, 8.5, textDark, curY - 7);
      curY -= 16;

      drawCenteredText(qrSub1, fontRegular, 7.5, textDark, curY - 6);
      curY -= 13;

      drawCenteredText(qrSub2, fontRegular, 7.5, textDark, curY - 6);
      curY -= 13;

      if (qrSubExtra) {
        drawCenteredText(qrSubExtra, fontRegular, 6.8, textMuted, curY - 5);
        curY -= 13;
      }
    } else {
      // Aviso sobrio de cuenta pendiente (sin QR estéril)
      drawCenteredText(qrTitle, fontBold, 8.5, textDark, curY - 7);
      curY -= 16;

      drawCenteredText(qrSub1, fontBold, 7.5, textDark, curY - 6);
      curY -= 14;

      drawCenteredText(qrSub2, fontRegular, 7.2, textMuted, curY - 6);
      curY -= 14;

      if (qrSubExtra) {
        drawCenteredText(qrSubExtra, fontRegular, 7, textMuted, curY - 5);
        curY -= 14;
      }
      curY -= 4;
    }

    drawDivider(curY);
    curY -= sep4H;

    // F. Pie de comprobante
    drawCenteredText('Conserve este comprobante.', fontRegular, 7, textMuted, curY - 6);
    curY -= 11;

    drawCenteredText('Gracias por confiar en nosotros.', fontRegular, 7, textMuted, curY - 6);
    curY -= 11;

    drawCenteredText('elhospitaldelcomputador.com', fontRegular, 7, textDark, curY - 6);

    return await pdfDoc.save();
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
    try {
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

      // Prevenir sobrescritura accidental de un documento ya firmado y sellado en R2
      const docExistente = await this.documentoRepository.findOne({
        where: { ordenId: orderId, tipoDocumento: dto.tipoDocumento },
        order: { fechaFirma: 'DESC' },
      });

      if (
        docExistente?.storageKeyPdf &&
        docExistente.estadoFirma === EstadoFirmaDocumento.FIRMADO
      ) {
        throw new BadRequestException(
          `El acta de ${dto.tipoDocumento} para la ODS #${orden.workOrderNumber} ya fue firmada y sellada previamente. No se puede reemplazar un documento oficial existente.`,
        );
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

        // Subir la imagen de la firma PNG a Cloudflare R2 / Almacenamiento local
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
            firmanteIdentificacion: dto.firmanteIdentificacion || '',
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

      // Subir el PDF generado a Cloudflare R2 / Almacenamiento local
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
          firmanteNombre: dto.firmanteNombre || '',
          firmanteIdentificacion: dto.firmanteIdentificacion || '',
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
    } catch (error: any) {
      this.logger.error(
        `Error al registrar firma para ODS #${orderId}: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Error al procesar y sellar el documento firmado: ${error.message}`,
      );
    }
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

    // --- 2. BLOQUE SUPERIOR DE DATOS (3 COLUMNAS: CLIENTE, EQUIPO, ACCESO DIGITAL) ---
    // A. Preparación del Código QR de Acceso / Activación del Cliente
    let embeddedQr: any = null;
    let qrDesc = 'Escanee para consultar el estado de su orden.';

    try {
      const frontendUrl =
        process.env.FRONTEND_URL ||
        (process.env.NODE_ENV === 'production'
          ? 'https://elhospitaldelcomputador.com'
          : 'http://localhost:4000');
      const clientId = orden.client?.id;

      // Verificar si el cliente ya tiene contraseña activa en la base de datos
      let tienePassword = false;
      if (clientId) {
        const clientWithPass = await this.userRepository.findOne({
          where: { id: clientId },
          select: ['id', 'password'],
        });
        tienePassword = Boolean(clientWithPass?.password);
      }

      let qrUrl: string;

      const rawToken =
        (dto as any)?.tokenActivacion ||
        (orden as any)?.tokenActivacion ||
        (orden as any)?.activacion?.token;

      if (tienePassword) {
        // ✅ Caso 1: Cliente con cuenta ya activada
        qrUrl = `${frontendUrl}/signin`;
        qrDesc = 'Escanee para consultar el estado de su orden.';
      } else {
        // ✅ Caso 2: Cliente con cuenta pendiente de activación (password IS NULL)
        let tokenValido = false;

        if (rawToken && typeof rawToken === 'string' && rawToken.trim() !== '' && clientId) {
          const tokenHash = crypto
            .createHash('sha256')
            .update(rawToken.trim())
            .digest('hex');

          const actRegistro = await this.activacionRepository.findOne({
            where: {
              tokenHash,
              usuarioId: clientId,
            },
          });

          if (
            actRegistro &&
            !actRegistro.usedAt &&
            !actRegistro.revokedAt &&
            new Date() < new Date(actRegistro.expiresAt)
          ) {
            tokenValido = true;
          } else {
            this.logger.warn(
              `Token de activación provisto para ODS #${orden.workOrderNumber} no es válido, expiró o está revocado. Se omitirá del PDF.`,
            );
          }
        }

        if (tokenValido) {
          // Emisión inicial o autorizada con token efímero vigente
          qrUrl = `${frontendUrl}/activar-cuenta?token=${encodeURIComponent(rawToken.trim())}`;
          qrDesc = 'Escanee para activar su cuenta y consultar su orden.';
        } else {
          // Reimpresión posterior sin token efímero o token no utilizable.
          qrUrl = `${frontendUrl}/activar-cuenta`;
          qrDesc = 'Consulte su orden en el portal o solicite activación.';
        }
      }

      const qrPngBuffer = await QRCode.toBuffer(qrUrl, {
        type: 'png',
        width: 180,
        margin: 1,
        errorCorrectionLevel: 'M',
      });

      embeddedQr = await pdfDoc.embedPng(qrPngBuffer);
    } catch (qrErr) {
      this.logger.warn(`No se pudo generar/incrustar código QR en bloque superior: ${qrErr.message}`);
    }

    // B. Maquetación equilibrada en 3 columnas
    y -= 12;
    const cardHeight = 84;
    const card1W = 175;
    const card2W = 168;
    const card3W = 160.28;
    const cardGap = 6;
    const card1X = 40;
    const card2X = card1X + card1W + cardGap; // 221
    const card3X = card2X + card2W + cardGap; // 395
    const cardY = y - cardHeight;

    // Columna 1: Datos del Cliente
    page.drawRectangle({
      x: card1X,
      y: cardY,
      width: card1W,
      height: cardHeight,
      borderWidth: 1,
      borderColor: borderLight,
      color: bgLight,
    });
    page.drawText('DATOS DEL CLIENTE', {
      x: card1X + 10,
      y: cardY + cardHeight - 14,
      size: 7.5,
      font: fontBold,
      color: textDark,
    });
    page.drawLine({
      start: { x: card1X + 10, y: cardY + cardHeight - 18 },
      end: { x: card1X + card1W - 10, y: cardY + cardHeight - 18 },
      thickness: 0.5,
      color: borderLight,
    });

    const clienteNombre =
      (orden.client
        ? `${orden.client.nombre || ''} ${orden.client.apellido || ''}`.trim()
        : dto.firmanteNombre) || 'Cliente General';
    const clienteCedula = (orden.client as any)?.cedula || dto.firmanteIdentificacion || 'N/D';
    const clienteTelf = orden.client?.telefono || 'No registrado';
    const fechaCreacionStr = orden.createdAt ? new Date(orden.createdAt).toLocaleDateString('es-ES') : 'N/D';

    const nomText = `Nombre: ${clienteNombre.substring(0, 36)}`;
    const nomSize = fontBold.widthOfTextAtSize(nomText, 7.2) > card1W - 20 ? 6.7 : 7.2;
    page.drawText(nomText, {
      x: card1X + 10,
      y: cardY + 51,
      size: nomSize,
      font: fontBold,
      color: textDark,
    });
    page.drawText(`Rol / Tipo: Cliente`, {
      x: card1X + 10,
      y: cardY + 39,
      size: 7,
      font: fontRegular,
      color: textDark,
    });
    page.drawText(`C.I. / RUC: ${clienteCedula}`, {
      x: card1X + 10,
      y: cardY + 27,
      size: 7,
      font: fontRegular,
      color: textDark,
    });
    page.drawText(`Teléfono: ${clienteTelf}`, {
      x: card1X + 10,
      y: cardY + 15,
      size: 7,
      font: fontRegular,
      color: textDark,
    });
    page.drawText(`Orden Creada: ${fechaCreacionStr}`, {
      x: card1X + 10,
      y: cardY + 5,
      size: 6.5,
      font: fontRegular,
      color: textMuted,
    });

    // Columna 2: Especificaciones del Equipo
    page.drawRectangle({
      x: card2X,
      y: cardY,
      width: card2W,
      height: cardHeight,
      borderWidth: 1,
      borderColor: borderLight,
      color: bgLight,
    });
    page.drawText('ESPECIFICACIONES DEL EQUIPO', {
      x: card2X + 10,
      y: cardY + cardHeight - 14,
      size: 7.5,
      font: fontBold,
      color: textDark,
    });
    page.drawLine({
      start: { x: card2X + 10, y: cardY + cardHeight - 18 },
      end: { x: card2X + card2W - 10, y: cardY + cardHeight - 18 },
      thickness: 0.5,
      color: borderLight,
    });

    const tipoEq = orden.equipo?.tipoEquipo?.nombre || 'General';
    const marcaMod = `${orden.equipo?.marca?.nombre || 'N/D'} ${orden.equipo?.modelo?.nombre || ''}`.trim();
    const serieEq = orden.equipo?.numeroSerie || 'Sin número de serie';

    page.drawText(`Tipo: ${tipoEq.substring(0, 26)}`, {
      x: card2X + 10,
      y: cardY + 51,
      size: 7.2,
      font: fontBold,
      color: textDark,
    });
    page.drawText(`Marca / Modelo:`, {
      x: card2X + 10,
      y: cardY + 39,
      size: 7,
      font: fontRegular,
      color: textMuted,
    });
    page.drawText(`${marcaMod.substring(0, 26)}`, {
      x: card2X + 10,
      y: cardY + 29,
      size: 7.2,
      font: fontBold,
      color: textDark,
    });
    page.drawText(`N° de Serie: ${serieEq.substring(0, 25)}`, {
      x: card2X + 10,
      y: cardY + 15,
      size: 7,
      font: fontRegular,
      color: textDark,
    });

    // Columna 3: Código QR de Acceso / Activación
    page.drawRectangle({
      x: card3X,
      y: cardY,
      width: card3W,
      height: cardHeight,
      borderWidth: 1,
      borderColor: borderLight,
      color: bgLight,
    });
    page.drawText('ACCESO DIGITAL', {
      x: card3X + 10,
      y: cardY + cardHeight - 14,
      size: 7.5,
      font: fontBold,
      color: textDark,
    });
    page.drawLine({
      start: { x: card3X + 10, y: cardY + cardHeight - 18 },
      end: { x: card3X + card3W - 10, y: cardY + cardHeight - 18 },
      thickness: 0.5,
      color: borderLight,
    });

    if (embeddedQr) {
      const qrSize = 52;
      const qrDrawX = card3X + 8;
      const qrDrawY = cardY + 8;

      page.drawImage(embeddedQr, {
        x: qrDrawX,
        y: qrDrawY,
        width: qrSize,
        height: qrSize,
      });

      const qrDescX = card3X + 66;
      const qrDescW = card3W - 66 - 6; // ~88 pt
      const qrDescLines = wrapText(qrDesc, fontRegular, 5.8, qrDescW);
      let curDescY = cardY + cardHeight - 26;
      for (const dLine of qrDescLines.slice(0, 3)) {
        page.drawText(dLine, {
          x: qrDescX,
          y: curDescY,
          size: 5.8,
          font: fontRegular,
          color: textDark,
        });
        curDescY -= 7.5;
      }

      // Pastilla del Identificador Permanente
      const pillY = cardY + 8;
      const pillH = 15;
      const pillW = qrDescW;
      page.drawRectangle({
        x: qrDescX,
        y: pillY,
        width: pillW,
        height: pillH,
        borderWidth: 0.6,
        borderColor: borderLight,
        color: rgb(1, 1, 1),
      });
      const userLabel = 'Usuario: su cédula';
      page.drawText(userLabel, {
        x: qrDescX + (pillW - fontBold.widthOfTextAtSize(userLabel, 6)) / 2,
        y: pillY + 4.5,
        size: 6,
        font: fontBold,
        color: brandDark,
      });
    }

    // --- 3. PROBLEMA REPORTADO EN RECEPCIÓN ---
    y = cardY - 10;
    const probContentWidth = width - 80 - 24;
    const probFont = fontOblique;
    const probFontSize = 7.8;
    const probLineHeight = 11;

    const rawProb = orden.problemaReportado?.trim() || 'Sin reporte detallado registrado.';
    let probLines = wrapText(`"${rawProb}"`, probFont, probFontSize, probContentWidth);
    if (probLines.length === 0) {
      probLines = ['"Sin reporte detallado registrado."'];
    }
    // Máximo 4 líneas seguras en portada para mantener diagramación óptima
    if (probLines.length > 4) {
      probLines = probLines.slice(0, 4);
      const lastLine = probLines[3];
      if (!lastLine.endsWith('..."')) {
        probLines[3] = `${lastLine.replace(/["\s]+$/, '')}..."`;
      }
    }

    // Altura calculada dinámicamente según la cantidad real de líneas
    const probHeight = Math.max(42, 22 + probLines.length * probLineHeight + 6);
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
      y: probY + probHeight - 14,
      size: 7.5,
      font: fontBold,
      color: textDark,
    });

    // Renderizar líneas ordenadamente de arriba hacia abajo
    let currentProbLineY = probY + probHeight - 25;
    for (const pLine of probLines) {
      page.drawText(pLine, {
        x: 52,
        y: currentProbLineY,
        size: probFontSize,
        font: probFont,
        color: textDark,
      });
      currentProbLineY -= probLineHeight;
    }

    // --- 4. SECCIONES INTERMEDIAS SEGÚN RECEPCIÓN O ENTREGA ---
    if (!isRecepcion) {
      // SECCIÓN: TRABAJOS Y ACTIVIDADES REALIZADAS
      y = probY - 16;
      page.drawText('TRABAJOS Y ACTIVIDADES REALIZADAS', {
        x: 40,
        y,
        size: 8.5,
        font: fontBold,
        color: brandDark,
      });
      y -= 6;
      page.drawLine({
        start: { x: 40, y },
        end: { x: width - 40, y },
        thickness: 0.8,
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
          const fStr = a.fecha ? new Date(a.fecha).toLocaleDateString('es-ES') : '';
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
        const actHeight = 26;
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
          y: y + 9,
          size: 7.5,
          font: fontOblique,
          color: textMuted,
        });
      }

      // SECCIÓN: DETALLE DE COSTOS Y PRESUPUESTO
      y -= 16;
      page.drawText('DETALLE DE COSTOS Y PRESUPUESTO', {
        x: 40,
        y,
        size: 8.5,
        font: fontBold,
        color: brandDark,
      });
      y -= 6;
      page.drawLine({
        start: { x: 40, y },
        end: { x: width - 40, y },
        thickness: 0.8,
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
        const presHeight = 26;
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
          y: y + 9,
          size: 7.5,
          font: fontOblique,
          color: textMuted,
        });
      }
    } else {
      // Recepción: Accesorios e Inspección Inicial
      y = probY - 10;

      // Accesorios entregados por el cliente
      const accStr =
        orden.accesorios && orden.accesorios.length > 0
          ? orden.accesorios.join(', ')
          : 'Ninguno registrado';

      const accBoxH = 22;
      y -= accBoxH;
      page.drawRectangle({
        x: 40,
        y,
        width: width - 80,
        height: accBoxH,
        borderWidth: 0.8,
        borderColor: borderLight,
        color: bgLight,
      });

      const accLabel = 'ACCESORIOS ENTREGADOS POR EL CLIENTE: ';
      page.drawText(accLabel, {
        x: 52,
        y: y + 7,
        size: 7.2,
        font: fontBold,
        color: textDark,
      });
      const accLabelW = fontBold.widthOfTextAtSize(accLabel, 7.2);
      page.drawText(accStr.substring(0, 85), {
        x: 52 + accLabelW,
        y: y + 7,
        size: 7.2,
        font: fontRegular,
        color: textDark,
      });

      const checklist = orden.checklistData;

      if (checklist) {
        y -= 10;
        const inspectionLines: { text: string; bold: boolean; oblique?: boolean; color?: any }[] = [];

        if (checklist.version === 2) {
          const rec = checklist.inspeccionRecepcion;
          const comp = checklist.inspeccionComplementaria;
          const encendidoStr = formatEncendidoPdf(rec?.estadoEncendido);
          const fisCount = rec?.fisica?.length || 0;
          const funcCount = rec?.funcional?.length || 0;
          const totalItems = fisCount + funcCount + (comp ? (comp.fisica?.length || 0) + (comp.funcional?.length || 0) : 0);

          if (totalItems > 3 || comp) {
            needsPage2 = true;
            inspectionLines.push({ text: `• Encendido al recibir: ${encendidoStr}`, bold: true, color: textDark });
            inspectionLines.push({ text: `• Inspección física (${fisCount} puntos) y funcional (${funcCount} pruebas) registradas.`, bold: false, color: textDark });
            if (comp) {
              const authTxt = comp.autorizacionCliente?.autorizado ? 'Autorizado por cliente' : 'Pendiente autorización';
              inspectionLines.push({ text: `• Escalamiento a Orden Completa: ${comp.motivoEscalamiento.substring(0, 55)} (${authTxt})`, bold: true, color: brandDark });
            }
            inspectionLines.push({ text: `• >> Ver detalle exhaustivo de inspección en Anexo Técnico adjunto (Página 2) <<`, bold: false, oblique: true, color: textMuted });
          } else {
            inspectionLines.push({ text: `• Encendido: ${encendidoStr}`, bold: true, color: textDark });
            if (rec?.fisica) {
              for (const f of rec.fisica) {
                const obs = f.observaciones ? ` (${f.observaciones})` : '';
                inspectionLines.push({ text: `• [Físico] ${f.item}: ${formatFisicoPdf(f.estado)}${obs}`.substring(0, 95), bold: false, color: textDark });
              }
            }
            if (rec?.funcional) {
              for (const fn of rec.funcional) {
                const obs = fn.observaciones ? ` (${fn.observaciones})` : '';
                inspectionLines.push({ text: `• [Funcional] ${fn.item}: ${formatFuncionalPdf(fn.estado)}${obs}`.substring(0, 95), bold: false, color: textDark });
              }
            }
          }
        } else if (Array.isArray(checklist.results) && checklist.results.length > 0) {
          if (checklist.results.length > 3) {
            needsPage2 = true;
            for (let i = 0; i < Math.min(checklist.results.length, 2); i++) {
              const item = checklist.results[i];
              inspectionLines.push({ text: `• ${item.item}: Funcionalidad: ${item.funcional || 'OK'} | Estética: ${item.estetica || 'OK'}`.substring(0, 95), bold: false, color: textDark });
            }
            inspectionLines.push({ text: `• Ver los ${checklist.results.length} puntos en el Anexo Técnico adjunto (Página 2)`, bold: false, oblique: true, color: textMuted });
          } else {
            for (const item of checklist.results) {
              inspectionLines.push({ text: `• ${item.item}: Funcionalidad: ${item.funcional || 'OK'} | Estética: ${item.estetica || 'OK'}`.substring(0, 95), bold: false, color: textDark });
            }
          }
        }

        const inspBoxH = Math.max(38, 22 + inspectionLines.length * 11 + 6);
        y -= inspBoxH;

        page.drawRectangle({
          x: 40,
          y,
          width: width - 80,
          height: inspBoxH,
          borderWidth: 1,
          borderColor: borderLight,
          color: bgLight,
        });

        page.drawText('INSPECCIÓN INICIAL DE RECEPCIÓN (ESTADO INICIAL)', {
          x: 52,
          y: y + inspBoxH - 14,
          size: 7.5,
          font: fontBold,
          color: textDark,
        });
        page.drawLine({
          start: { x: 52, y: y + inspBoxH - 18 },
          end: { x: width - 52, y: y + inspBoxH - 18 },
          thickness: 0.5,
          color: borderLight,
        });

        let curInspY = y + inspBoxH - 28;
        for (const line of inspectionLines) {
          page.drawText(line.text, {
            x: 52,
            y: curInspY,
            size: 7.2,
            font: line.bold ? fontBold : (line.oblique ? fontOblique : fontRegular),
            color: line.color || textDark,
          });
          curInspY -= 11;
        }
      }
    }

    // --- 5. TÉRMINOS Y CONDICIONES / CONFORMIDAD ---
    y -= 10;
    const terminosTitulo = isRecepcion
      ? 'TÉRMINOS Y CONDICIONES DE RECEPCIÓN'
      : 'CONFORMIDAD DEL SERVICIO Y GARANTÍA';

    let terminosLineas: string[] = [];
    if (isRecepcion) {
      const rawTerminos =
        config?.terminosRecepcion ||
        [
          '1. RESPALDO DE INFORMACIÓN: Hospital del Computador no se responsabiliza por la pérdida de datos o software en discos de almacenamiento, debiendo el cliente respaldar previamente su información.',
          '2. CLÁUSULA DE ABANDONO: Equipos no retirados tras 60 días contados a partir de la notificación de finalización causarán costos de bodegaje y podrán ser considerados en abandono legal conforme a la ley.',
          '3. DIAGNÓSTICO PRELIMINAR: La recepción inicial es presuntiva y está sujeta a confirmación y diagnóstico definitivo por parte del departamento técnico en laboratorio.',
        ].join('\n');

      terminosLineas = rawTerminos
        .replace(/\\r\\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\r\n/g, '\n')
        .replace(/\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .map((l: string) => l.trim())
        .filter(Boolean);
    } else {
      const rawTerminos =
        config?.terminosEntrega ||
        [
          'El cliente declara haber recibido el equipo especificado en el presente documento a su entera conformidad, habiendo verificado su correcto funcionamiento tras la realización del servicio técnico.',
          'Toda reparación cuenta con una garantía limitada según los términos establecidos por la empresa a partir de la fecha de entrega.',
          'Esta garantía no cubre daños por mal uso, golpes, humedad o intervención de terceros.',
        ].join('\n');

      terminosLineas = rawTerminos
        .replace(/\\r\\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\r\n/g, '\n')
        .replace(/\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .map((l: string) => l.trim())
        .filter(Boolean);
    }

    // Conservamos los términos y condiciones completos sin truncamiento arbitrario
    const terminosRenderLines: string[] = [];
    for (const t of terminosLineas) {
      const wrapped = wrapText(t, fontRegular, 6.3, width - 80 - 24);
      for (const subLine of wrapped) {
        terminosRenderLines.push(subLine);
      }
    }

    const termBoxH = Math.max(38, 22 + terminosRenderLines.length * 9.2 + 6);
    y -= termBoxH;

    page.drawRectangle({
      x: 40,
      y,
      width: width - 80,
      height: termBoxH,
      borderWidth: 1,
      borderColor: borderLight,
      color: bgLight,
    });

    page.drawText(terminosTitulo, {
      x: 52,
      y: y + termBoxH - 14,
      size: 7.5,
      font: fontBold,
      color: textDark,
    });
    page.drawLine({
      start: { x: 52, y: y + termBoxH - 18 },
      end: { x: width - 52, y: y + termBoxH - 18 },
      thickness: 0.5,
      color: borderLight,
    });

    let curTermY = y + termBoxH - 27;
    for (const tLine of terminosRenderLines) {
      page.drawText(tLine, {
        x: 52,
        y: curTermY,
        size: 6.3,
        font: fontRegular,
        color: textMuted,
      });
      curTermY -= 9.2;
    }

    // --- 6. BLOQUE DE FIRMAS (2 COLUMNAS EQUILIBRADAS: CLIENTE Y ESTABLECIMIENTO) ---
    // Calculamos signY armónicamente respetando el espacio disponible y eliminando huecos excesivos
    const signBoxWidth = 240;
    const availableSpace = y - 35; // espacio desde fin de términos hasta pie de página
    const signBlockHeight = 82;    // altura total del bloque de firmas
    const slack = availableSpace - signBlockHeight;

    // Distribuimos el espacio vertical: margen superior controlado respecto a términos
    // con un mínimo de 16 pt y un tope de 36 pt para garantizar continuidad visual limpia
    const gapAboveSign = Math.min(36, Math.max(16, slack * 0.22));
    const signY = Math.max(64, y - 60 - gapAboveSign);

    // A. Firma del Cliente (Columna Izquierda)
    if (firmaBuffer && dto.estadoFirma !== EstadoFirmaDocumento.RECHAZADO_CLIENTE) {
      try {
        const embeddedPng = await pdfDoc.embedPng(firmaBuffer);
        const imgDims = embeddedPng.scaleToFit(160, 44);
        page.drawImage(embeddedPng, {
          x: 40 + (signBoxWidth - imgDims.width) / 2,
          y: signY + 12,
          width: imgDims.width,
          height: imgDims.height,
        });
      } catch (err) {
        this.logger.warn(`No se pudo incrustar PNG en PDF: ${err.message}`);
      }
    } else if (dto.estadoFirma === EstadoFirmaDocumento.RECHAZADO_CLIENTE) {
      page.drawText('CONSTANCIA: CLIENTE SE NEGÓ A FIRMAR', {
        x: 40 + (signBoxWidth - fontBold.widthOfTextAtSize('CONSTANCIA: CLIENTE SE NEGÓ A FIRMAR', 7.5)) / 2,
        y: signY + 20,
        size: 7.5,
        font: fontBold,
        color: rgb(0.8, 0.2, 0.2),
      });
    } else {
      const pendTxt = '(Pendiente de firma manuscrita)';
      page.drawText(pendTxt, {
        x: 40 + (signBoxWidth - fontOblique.widthOfTextAtSize(pendTxt, 7.5)) / 2,
        y: signY + 20,
        size: 7.5,
        font: fontOblique,
        color: rgb(0.55, 0.58, 0.63),
      });
    }

    page.drawLine({
      start: { x: 40, y: signY + 8 },
      end: { x: 40 + signBoxWidth, y: signY + 8 },
      thickness: 1,
      color: borderLight,
    });

    const firmaClienteTitulo = isRecepcion ? 'FIRMA DEL CLIENTE / RECEPTOR' : 'FIRMA DEL CLIENTE';
    page.drawText(firmaClienteTitulo, {
      x: 40 + (signBoxWidth - fontBold.widthOfTextAtSize(firmaClienteTitulo, 7.5)) / 2,
      y: signY - 3,
      size: 7.5,
      font: fontBold,
      color: brandDark,
    });

    const safeFirmanteNombre = (dto.firmanteNombre || clienteNombre).substring(0, 36);
    page.drawText(`${safeFirmanteNombre}`, {
      x: 40 + (signBoxWidth - fontRegular.widthOfTextAtSize(safeFirmanteNombre, 7)) / 2,
      y: signY - 13,
      size: 7,
      font: fontRegular,
      color: textDark,
    });

    const safeFirmanteId = dto.firmanteIdentificacion || clienteCedula;
    page.drawText(`C.I. / RUC: ${safeFirmanteId}`, {
      x: 40 + (signBoxWidth - fontRegular.widthOfTextAtSize(`C.I. / RUC: ${safeFirmanteId}`, 6.8)) / 2,
      y: signY - 22,
      size: 6.8,
      font: fontRegular,
      color: textMuted,
    });

    // B. Firma y Sello del Establecimiento (Columna Derecha)
    const hcX = width - 40 - signBoxWidth; // 595.28 - 40 - 240 = 315.28
    const firmaConfig = await this.firmaElectronicaService.getConfig();

    if (firmaConfig && firmaConfig.activo) {
      // Estampa Visual Oficial FirmaEC - Estilo Formal Monocromático con QR a la izquierda
      const titularNombre = (firmaConfig.titularNombre || 'ANGEL PAUL OBREGON MAYORGA').trim();
      const titularCedula = (firmaConfig.titularCedulaRuc || '').trim();

      let embeddedFirmaEcQr: any = null;
      try {
        const qrFirmaPayload = `FirmaEC | Titular: ${titularNombre} | C.I.: ${titularCedula || '0601927122'} | Valide en https://www.firmadigital.gob.ec`;
        const qrFirmaBuffer = await QRCode.toBuffer(qrFirmaPayload, {
          type: 'png',
          width: 140,
          margin: 0,
          errorCorrectionLevel: 'M',
        });
        embeddedFirmaEcQr = await pdfDoc.embedPng(qrFirmaBuffer);
      } catch (qrFirmaErr) {
        this.logger.warn(`No se pudo generar QR para bloque de firma electrónica: ${qrFirmaErr.message}`);
      }

      const stampH = 48;
      const stampY = signY + 12;

      // Recuadro formal monocromático con borde fino gris claro y fondo blanco
      page.drawRectangle({
        x: hcX,
        y: stampY,
        width: signBoxWidth,
        height: stampH,
        borderColor: borderLight,
        borderWidth: 0.8,
        color: rgb(1, 1, 1),
      });

      // 1. QR cuadrado de validación a la izquierda
      if (embeddedFirmaEcQr) {
        const qrSize = 40;
        const qrX = hcX + 6;
        const qrY = stampY + (stampH - qrSize) / 2;
        page.drawImage(embeddedFirmaEcQr, {
          x: qrX,
          y: qrY,
          width: qrSize,
          height: qrSize,
        });
      }

      // 2. Textos de validación formal a la derecha del QR
      const textX = hcX + 52;
      const textW = signBoxWidth - 52 - 6;

      page.drawText('Validar únicamente en FirmaEC.', {
        x: textX,
        y: stampY + stampH - 11,
        size: 5.5,
        font: fontRegular,
        color: textMuted,
      });

      page.drawText('Firmado electrónicamente por:', {
        x: textX,
        y: stampY + stampH - 18.5,
        size: 5.5,
        font: fontRegular,
        color: textMuted,
      });

      const nomLines = wrapText(titularNombre.toUpperCase(), fontBold, 7.2, textW);
      let curNomY = stampY + stampH - 28.5;
      for (const nLine of nomLines.slice(0, 2)) {
        page.drawText(nLine, {
          x: textX,
          y: curNomY,
          size: 7.2,
          font: fontBold,
          color: brandDark,
        });
        curNomY -= 8.5;
      }

      if (titularCedula) {
        page.drawText(`C.I.: ${titularCedula}`, {
          x: textX,
          y: curNomY,
          size: 6.5,
          font: fontRegular,
          color: textDark,
        });
      }
    } else {
      // Sello institucional autorizado de Hospital del Computador
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
          const hdcDims = embeddedHdcPng.scaleToFit(160, 44);
          page.drawImage(embeddedHdcPng, {
            x: hcX + (signBoxWidth - hdcDims.width) / 2,
            y: signY + 12,
            width: hdcDims.width,
            height: hdcDims.height,
          });
        } catch (err) {
          this.logger.warn(`No se pudo incrustar firma HDC: ${err.message}`);
        }
      }
    }

    page.drawLine({
      start: { x: hcX, y: signY + 8 },
      end: { x: hcX + signBoxWidth, y: signY + 8 },
      thickness: 1,
      color: borderLight,
    });

    const firmaHcTitulo = isRecepcion ? 'RECIBIDO POR (HC)' : 'ENTREGADO POR (CENTRO DE SERVICIO)';
    page.drawText(firmaHcTitulo, {
      x: hcX + (signBoxWidth - fontBold.widthOfTextAtSize(firmaHcTitulo, 7.5)) / 2,
      y: signY - 3,
      size: 7.5,
      font: fontBold,
      color: brandDark,
    });

    const subtextoHc = 'Hospital del Computador - Centro de Servicio Técnico';
    page.drawText(subtextoHc, {
      x: hcX + (signBoxWidth - fontRegular.widthOfTextAtSize(subtextoHc, 7)) / 2,
      y: signY - 13,
      size: 7,
      font: fontRegular,
      color: textMuted,
    });

    // --- 7. PIE DE PÁGINA ---
    const footerY = 20;
    const footerText = 'Documento generado electrónicamente por el Sistema de Gestión de Órdenes (ODS) – Hospital del Computador';
    page.drawText(footerText, {
      x: 40 + (width - 80 - fontRegular.widthOfTextAtSize(footerText, 6.5)) / 2,
      y: footerY,
      size: 6.5,
      font: fontRegular,
      color: textMuted,
    });
    const auditText = `Centro de Servicio Técnico – Hospital del Computador | Riobamba, Chimborazo, Ecuador`;
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

    const declLines = wrapText(textoDeclaracion, fontRegular, 6.2, width - 80 - 16);
    let declY = y - 22;
    for (const dLine of declLines.slice(0, 3)) {
      page.drawText(dLine, { x: 48, y: declY, size: 6.2, font: fontRegular, color: textDark });
      declY -= 9;
    }

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
