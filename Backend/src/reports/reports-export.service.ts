import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';
import { ConfiguracionSistemaService } from '../configuracion-sistema/configuracion-sistema.service';
import { StorageService } from '../storage/storage.service';
import { formatEcuadorDate } from './utils/date-range.util';
import * as fs from 'fs';
import * as path from 'path';

const sharp = require('sharp');

export interface ReportColumnDefinition {
  header: string;
  key: string;
  width?: number; // Ancho sugerido
  align?: 'left' | 'center' | 'right';
  type?: 'text' | 'number' | 'currency' | 'date';
}

export interface ExportReportOptions {
  title: string;
  subtitle?: string;
  dateRangeLabel: string;
  generatedBy?: string;
  columns: ReportColumnDefinition[];
  data: any[];
  kpis?: { label: string; value: string | number }[];
  totals?: Record<string, number | string>;
}

@Injectable()
export class ReportsExportService {
  private readonly logger = new Logger(ReportsExportService.name);

  constructor(
    private readonly configuracionSistemaService: ConfiguracionSistemaService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Obtiene el buffer del logo corporativo oficial (Cloudflare R2 o local fallback)
   */
  private async getOfficialLogoBuffer(): Promise<Buffer | null> {
    try {
      const config = await this.configuracionSistemaService.obtenerConfiguracion();
      if (config?.storageKeyLogo) {
        try {
          const rawBuffer = await this.storageService.getFileBuffer(config.storageKeyLogo);
          if (rawBuffer && rawBuffer.length > 0) {
            // Convertir a PNG estándar para compatibilidad universal con ExcelJS y PDFKit
            return await sharp(rawBuffer).png().toBuffer();
          }
        } catch (err) {
          this.logger.warn(`No se pudo leer logo desde R2 [${config.storageKeyLogo}]: ${err.message}`);
        }
      }

      // Fallback a archivo local en assets/logo_hdc.png
      const localPath = path.join(process.cwd(), 'assets', 'logo_hdc.png');
      if (fs.existsSync(localPath)) {
        return fs.readFileSync(localPath);
      }
    } catch (e) {
      this.logger.warn(`Error al obtener buffer del logo oficial: ${e.message}`);
    }
    return null;
  }

  /**
   * Sanitiza valores de celdas para prevenir inyección de fórmulas en CSV/Excel (CSV Injection)
   */
  private sanitizeCell(val: any): any {
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (
        trimmed.startsWith('=') ||
        trimmed.startsWith('+') ||
        trimmed.startsWith('-') ||
        trimmed.startsWith('@')
      ) {
        return `'${val}`;
      }
    }
    return val;
  }

  // =========================================================================
  // 1. GENERACIÓN DE EXCEL REAL (.XLSX) CON EXCELJS
  // =========================================================================
  async generateExcel(options: ExportReportOptions): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Hospital del Computador';
    workbook.lastModifiedBy = options.generatedBy || 'Sistema';
    workbook.created = new Date();
    workbook.modified = new Date();

    const config = await this.configuracionSistemaService.obtenerConfiguracion();
    const sheetName = options.title.slice(0, 30).replace(/[:\\\/\?\*\[\]]/g, '');
    const worksheet = workbook.addWorksheet(sheetName || 'Reporte', {
      views: [{ showGridLines: true }],
      pageSetup: { orientation: options.columns.length > 7 ? 'landscape' : 'portrait' },
    });

    const logoBuffer = await this.getOfficialLogoBuffer();

    // 1. Encabezado corporativo (Filas 1 a 4)
    if (logoBuffer) {
      const imageId = workbook.addImage({
        base64: logoBuffer.toString('base64'),
        extension: 'png',
      });
      worksheet.addImage(imageId, {
        tl: { col: 0.1, row: 0.2 },
        ext: { width: 140, height: 38 },
      });
    }

    const titleCol = logoBuffer ? 3 : 1;
    worksheet.mergeCells(`C1:${String.fromCharCode(65 + Math.min(options.columns.length, 8))}1`);
    const titleCell = worksheet.getCell('C1');
    titleCell.value = (config.nombreComercial || 'Hospital del Computador').toUpperCase();
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF1E3A8A' } };

    worksheet.getCell('C2').value = `RUC: ${config.ruc || '1792999999001'}  |  Telf: ${config.telefono || config.whatsapp || '0969620222'}`;
    worksheet.getCell('C2').font = { name: 'Arial', size: 9, color: { argb: 'FF64748B' } };

    worksheet.getCell('C3').value = `Dirección: ${config.direccion || 'Riobamba, Ecuador'}  |  Email: ${config.correoContacto || 'soporte@hospitaldelcomputador.com'}`;
    worksheet.getCell('C3').font = { name: 'Arial', size: 9, color: { argb: 'FF64748B' } };

    // 2. Metadatos del Reporte (Filas 5 a 7)
    worksheet.getCell('A5').value = options.title.toUpperCase();
    worksheet.getCell('A5').font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF0F172A' } };

    worksheet.getCell('A6').value = `Período: ${options.dateRangeLabel}`;
    worksheet.getCell('A6').font = { name: 'Arial', size: 10, italic: true };

    const fechaActualEcuador = formatEcuadorDate(new Date(), true);
    worksheet.getCell('A7').value = `Emitido por: ${options.generatedBy || 'Administrador'}  |  Fecha de emisión: ${fechaActualEcuador} (Hora Ecuador)`;
    worksheet.getCell('A7').font = { name: 'Arial', size: 9, color: { argb: 'FF64748B' } };

    let currentRow = 9;

    // 3. Tarjetas KPI opcionales
    if (options.kpis && options.kpis.length > 0) {
      options.kpis.forEach((kpi, idx) => {
        const colLetter = String.fromCharCode(65 + (idx % 6) * 2);
        const nextCol = String.fromCharCode(66 + (idx % 6) * 2);
        worksheet.mergeCells(`${colLetter}${currentRow}:${nextCol}${currentRow}`);
        worksheet.mergeCells(`${colLetter}${currentRow + 1}:${nextCol}${currentRow + 1}`);

        const labelCell = worksheet.getCell(`${colLetter}${currentRow}`);
        labelCell.value = kpi.label.toUpperCase();
        labelCell.font = { name: 'Arial', size: 8, bold: true, color: { argb: 'FF475569' } };
        labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        labelCell.alignment = { horizontal: 'center' };

        const valCell = worksheet.getCell(`${colLetter}${currentRow + 1}`);
        valCell.value = kpi.value;
        valCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF1E3A8A' } };
        valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        valCell.alignment = { horizontal: 'center' };
      });
      currentRow += 3;
    }

    // 4. Encabezados de la Tabla
    const headerRowNumber = currentRow;
    const headerRow = worksheet.getRow(headerRowNumber);
    headerRow.height = 24;

    options.columns.forEach((col, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = col.header;
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
      cell.alignment = { horizontal: col.align || 'left', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF0F172A' } },
        bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
        left: { style: 'thin', color: { argb: 'FF334155' } },
        right: { style: 'thin', color: { argb: 'FF334155' } },
      };
    });

    currentRow++;

    // 5. Filas de Datos
    options.data.forEach((item, rowIdx) => {
      const dataRow = worksheet.getRow(currentRow);
      dataRow.height = 20;
      const isEven = rowIdx % 2 === 0;

      options.columns.forEach((col, colIdx) => {
        const cell = dataRow.getCell(colIdx + 1);
        let rawVal = item[col.key];

        if (rawVal === undefined || rawVal === null) {
          rawVal = '-';
        }

        cell.value = this.sanitizeCell(rawVal);
        cell.font = { name: 'Arial', size: 9 };
        cell.alignment = { horizontal: col.align || 'left', vertical: 'middle' };

        // Formatos específicos
        if (col.type === 'currency' && typeof rawVal === 'number') {
          cell.numFmt = '"$"#,##0.00';
        } else if (col.type === 'number' && typeof rawVal === 'number') {
          cell.numFmt = '#,##0';
        }

        // Alternancia de colores
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF8FAFC' },
        };

        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });

      currentRow++;
    });

    // 6. Fila de Totales si aplica
    if (options.totals) {
      const totalRow = worksheet.getRow(currentRow);
      totalRow.height = 22;
      options.columns.forEach((col, colIdx) => {
        const cell = totalRow.getCell(colIdx + 1);
        const totalVal = options.totals[col.key];

        if (colIdx === 0 && !totalVal) {
          cell.value = 'TOTALES:';
        } else if (totalVal !== undefined && totalVal !== null) {
          cell.value = totalVal;
          if (col.type === 'currency' && typeof totalVal === 'number') {
            cell.numFmt = '"$"#,##0.00';
          }
        }

        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF0F172A' } },
          bottom: { style: 'double', color: { argb: 'FF0F172A' } },
        };
        cell.alignment = { horizontal: col.align || 'left', vertical: 'middle' };
      });
      currentRow++;
    }

    // 7. Auto-ajuste de ancho de columnas
    options.columns.forEach((col, idx) => {
      const column = worksheet.getColumn(idx + 1);
      const customWidth = col.width || Math.max(col.header.length + 4, 12);
      column.width = Math.min(customWidth, 40);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // =========================================================================
  // 2. GENERACIÓN DE PDF FORMAL VECTORIAL CON PDFKIT
  // =========================================================================
  async generatePdf(options: ExportReportOptions): Promise<Buffer> {
    const isLandscape = options.columns.length > 6;
    const config = await this.configuracionSistemaService.obtenerConfiguracion();
    const logoBuffer = await this.getOfficialLogoBuffer();

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        layout: isLandscape ? 'landscape' : 'portrait',
        margin: 36, // 0.5 pulgada
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const result = Buffer.concat(chunks);
        resolve(result);
      });
      doc.on('error', (err) => reject(err));

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const contentWidth = pageWidth - 72;

      // Helper para dibujar encabezado corporativo
      const drawHeader = () => {
        let currentY = 36;

        // Logo oficial o texto
        if (logoBuffer) {
          try {
            doc.image(logoBuffer, 36, currentY, { fit: [140, 36] });
          } catch (e) {
            doc.fontSize(14).fillColor('#1E3A8A').text(config.nombreComercial || 'Hospital del Computador', 36, currentY);
          }
        } else {
          doc.fontSize(14).fillColor('#1E3A8A').text(config.nombreComercial || 'Hospital del Computador', 36, currentY);
        }

        // Datos de la empresa a la derecha
        doc
          .fontSize(8)
          .fillColor('#64748B')
          .text(`RUC: ${config.ruc || '1792999999001'}`, pageWidth - 236, currentY, { width: 200, align: 'right' })
          .text(`Telf: ${config.telefono || config.whatsapp || '0969620222'}`, pageWidth - 236, currentY + 11, { width: 200, align: 'right' })
          .text(`${config.direccion || 'Riobamba, Ecuador'}`, pageWidth - 236, currentY + 22, { width: 200, align: 'right' });

        // Línea divisoria
        doc
          .strokeColor('#CBD5E1')
          .lineWidth(1)
          .moveTo(36, currentY + 44)
          .lineTo(pageWidth - 36, currentY + 44)
          .stroke();

        // Título del reporte
        doc
          .fontSize(13)
          .fillColor('#0F172A')
          .font('Helvetica-Bold')
          .text(options.title.toUpperCase(), 36, currentY + 52);

        // Subtítulo oficial
        doc
          .fontSize(7.5)
          .font('Helvetica')
          .fillColor('#94A3B8')
          .text('REPORTE ADMINISTRATIVO INTERNO — No constituye acta de entrega ni comprobante tributario', 36, currentY + 68);

        // Metadatos
        const fechaEcuador = formatEcuadorDate(new Date(), true);
        doc
          .fontSize(8)
          .fillColor('#475569')
          .text(`Período: ${options.dateRangeLabel}   |   Emitido por: ${options.generatedBy || 'Administrador'}   |   Emisión: ${fechaEcuador} (UTC-5)`, 36, currentY + 79);

        return currentY + 95;
      };

      let tableTop = drawHeader();

      // KPIs si existen
      if (options.kpis && options.kpis.length > 0) {
        const kpiCount = Math.min(options.kpis.length, 4);
        const kpiWidth = (contentWidth - (kpiCount - 1) * 8) / kpiCount;

        options.kpis.slice(0, 4).forEach((kpi, idx) => {
          const kpiX = 36 + idx * (kpiWidth + 8);
          doc
            .rect(kpiX, tableTop, kpiWidth, 32)
            .fillAndStroke('#F8FAFC', '#E2E8F0');

          doc
            .fontSize(7)
            .fillColor('#64748B')
            .font('Helvetica-Bold')
            .text(kpi.label.toUpperCase(), kpiX + 4, tableTop + 5, { width: kpiWidth - 8, align: 'center' });

          doc
            .fontSize(10)
            .fillColor('#1E3A8A')
            .font('Helvetica-Bold')
            .text(String(kpi.value), kpiX + 4, tableTop + 16, { width: kpiWidth - 8, align: 'center' });
        });

        tableTop += 40;
      }

      // Cálculo de anchos de columna
      const totalSuggestedWidth = options.columns.reduce((sum, c) => sum + (c.width || 15), 0);
      const colWidths = options.columns.map((c) => Math.floor(((c.width || 15) / totalSuggestedWidth) * contentWidth));

      // Función para dibujar encabezado de la tabla
      const drawTableHeader = (y: number) => {
        doc.rect(36, y, contentWidth, 18).fill('#1E3A8A');

        let colX = 36;
        options.columns.forEach((col, idx) => {
          const w = colWidths[idx];
          doc
            .fontSize(7.5)
            .fillColor('#FFFFFF')
            .font('Helvetica-Bold')
            .text(col.header, colX + 3, y + 5, {
              width: w - 6,
              align: col.align || 'left',
              ellipsis: true,
            });
          colX += w;
        });

        return y + 18;
      };

      let currentY = drawTableHeader(tableTop);

      // Filas de datos
      doc.font('Helvetica');
      options.data.forEach((row, rowIdx) => {
        // Verificar si la fila entra en la página actual
        if (currentY + 18 > pageHeight - 45) {
          doc.addPage();
          currentY = drawTableHeader(36);
        }

        const isEven = rowIdx % 2 === 0;
        doc
          .rect(36, currentY, contentWidth, 16)
          .fill(isEven ? '#FFFFFF' : '#F8FAFC');

        let colX = 36;
        options.columns.forEach((col, idx) => {
          const w = colWidths[idx];
          let val = row[col.key];

          if (val === undefined || val === null) {
            val = '-';
          } else if (col.type === 'currency' && typeof val === 'number') {
            val = `$ ${val.toFixed(2)}`;
          } else if (col.type === 'date' && val) {
            val = formatEcuadorDate(val);
          }

          doc
            .fontSize(7)
            .fillColor('#1E293B')
            .text(String(val), colX + 3, currentY + 4, {
              width: w - 6,
              align: col.align || 'left',
              ellipsis: true,
            });

          colX += w;
        });

        currentY += 16;
      });

      // Fila de totales si aplica
      if (options.totals) {
        if (currentY + 20 > pageHeight - 45) {
          doc.addPage();
          currentY = 36;
        }

        doc.rect(36, currentY, contentWidth, 18).fill('#E2E8F0');
        let colX = 36;
        options.columns.forEach((col, idx) => {
          const w = colWidths[idx];
          let totalVal = options.totals[col.key];

          if (idx === 0 && !totalVal) {
            totalVal = 'TOTALES';
          } else if (col.type === 'currency' && typeof totalVal === 'number') {
            totalVal = `$ ${totalVal.toFixed(2)}`;
          }

          if (totalVal !== undefined && totalVal !== null) {
            doc
              .fontSize(7.5)
              .font('Helvetica-Bold')
              .fillColor('#0F172A')
              .text(String(totalVal), colX + 3, currentY + 5, {
                width: w - 6,
                align: col.align || 'left',
              });
          }
          colX += w;
        });
      }

      // Numeración de páginas en pie de página (Página X de Y)
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc
          .strokeColor('#E2E8F0')
          .lineWidth(0.5)
          .moveTo(36, pageHeight - 28)
          .lineTo(pageWidth - 36, pageHeight - 28)
          .stroke();

        doc
          .fontSize(7)
          .fillColor('#94A3B8')
          .text(
            'Hospital del Computador — Sistema Administrativo HDC 2.0',
            36,
            pageHeight - 22,
            { align: 'left' },
          );

        doc
          .fontSize(7)
          .fillColor('#94A3B8')
          .text(
            `Página ${i + 1} de ${range.count}`,
            pageWidth - 136,
            pageHeight - 22,
            { width: 100, align: 'right' },
          );
      }

      doc.end();
    });
  }
}
