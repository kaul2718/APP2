export interface EquipmentLabelData {
  workOrderNumber: string;
  equipmentLine: string;
  clientName: string;
  phone: string;
  orderUrl: string;
}

const PRODUCTION_SITE_URL = 'https://elhospitaldelcomputador.com';
const MAX_CLIENT_NAME_CHARS = 21;
const MAX_EQUIPMENT_LINE_CHARS = 24;
const MAX_PHONE_CHARS = 13;

export function normalizeWhitespace(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function sanitizeLogoSrc(logoSrc: string): string {
  const trimmed = normalizeWhitespace(logoSrc);
  if (trimmed.startsWith('/') || trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return escapeHtml(trimmed);
  }
  return '/images/logo/logo-icon.svg';
}

export function sanitizeQrDataUrl(qrDataUrl?: string | null): string | null {
  if (typeof qrDataUrl !== 'string') return null;
  const trimmed = qrDataUrl.trim();
  if (/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

export function buildOrderDetailUrl(order: any): string {
  const envUrl = normalizeWhitespace(process.env.NEXT_PUBLIC_SITE_URL);
  const isLocalEnv = !envUrl || /localhost|127\.0\.0\.1/i.test(envUrl);
  const baseUrl = (isLocalEnv ? PRODUCTION_SITE_URL : envUrl).replace(/\/+$/, '');
  const orderId = order?.id !== undefined && order?.id !== null ? String(order.id).trim() : '';
  return orderId ? `${baseUrl}/ver-orden/${encodeURIComponent(orderId)}` : `${baseUrl}/ver-orden`;
}

function formatTitleWord(word: string): string {
  if (!word) return '';
  const lower = word.toLocaleLowerCase('es-EC');
  return lower.charAt(0).toLocaleUpperCase('es-EC') + lower.slice(1);
}

function truncateWithEllipsis(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  if (maxChars <= 1) return text.slice(0, maxChars);
  return `${text.slice(0, maxChars - 1).trimEnd()}…`;
}

export function formatWorkOrderNumber(order: any): string {
  const raw = normalizeWhitespace(order?.workOrderNumber);
  if (raw) return raw;
  if (order?.id !== undefined && order?.id !== null) {
    return `ODS-${order.id}`;
  }
  return 'ODS-SIN-NUM';
}

export function formatShortClientName(client: any): string {
  const nombreRaw = normalizeWhitespace(client?.nombre);
  const apellidoRaw = normalizeWhitespace(client?.apellido);

  const firstNombre = nombreRaw.split(' ').filter(Boolean)[0] || '';
  const firstApellido = apellidoRaw.split(' ').filter(Boolean)[0] || '';

  if (!firstNombre && !firstApellido) {
    return 'Cliente';
  }

  const nombreFmt = formatTitleWord(firstNombre);
  const apellidoFmt = formatTitleWord(firstApellido);
  const fullShort = [nombreFmt, apellidoFmt].filter(Boolean).join(' ');

  if (fullShort.length <= MAX_CLIENT_NAME_CHARS) {
    return fullShort;
  }

  // Si excede el ancho útil, abreviar el primer nombre a inicial: "K. Amores"
  if (nombreFmt && apellidoFmt) {
    const initialForm = `${nombreFmt.charAt(0)}. ${apellidoFmt}`;
    if (initialForm.length <= MAX_CLIENT_NAME_CHARS) {
      return initialForm;
    }
    return truncateWithEllipsis(initialForm, MAX_CLIENT_NAME_CHARS);
  }

  return truncateWithEllipsis(fullShort, MAX_CLIENT_NAME_CHARS);
}

export function formatShortPhone(telefono: unknown): string {
  const raw = normalizeWhitespace(telefono);
  if (!raw) return 'Sin tel.';
  const compact = raw.replace(/[\s\-()]/g, '');
  if (!compact) return 'Sin tel.';
  return truncateWithEllipsis(compact, MAX_PHONE_CHARS);
}

function abbreviateEquipmentType(tipo: string): string {
  const lower = tipo.toLocaleLowerCase('es-EC');
  if (lower.includes('escritorio')) return 'PC Escritorio';
  if (lower.includes('multifunci')) return 'Impresora';
  if (lower.includes('portátil') || lower.includes('portatil')) return 'Laptop';
  if (lower.includes('todo en uno') || lower.includes('all in one')) return 'All-in-One';
  return tipo;
}

export function formatEquipmentSummary(equipo: any): string {
  const tipoRaw = normalizeWhitespace(equipo?.tipoEquipo?.nombre ?? equipo?.tipoEquipo);
  const marcaRaw = normalizeWhitespace(equipo?.marca?.nombre ?? equipo?.marca);

  const tipo = tipoRaw ? abbreviateEquipmentType(tipoRaw) : '';
  const marca = marcaRaw;

  if (!tipo && !marca) return 'Equipo en taller';
  if (tipo && !marca) return truncateWithEllipsis(tipo, MAX_EQUIPMENT_LINE_CHARS);
  if (!tipo && marca) return truncateWithEllipsis(marca, MAX_EQUIPMENT_LINE_CHARS);

  const combined = `${tipo} · ${marca}`;
  if (combined.length <= MAX_EQUIPMENT_LINE_CHARS) {
    return combined;
  }

  const tipoTrunc = truncateWithEllipsis(tipo, 15);
  const remaining = Math.max(8, MAX_EQUIPMENT_LINE_CHARS - tipoTrunc.length - 3);
  const marcaTrunc = truncateWithEllipsis(marca, remaining);
  return `${tipoTrunc} · ${marcaTrunc}`;
}

export function buildEquipmentLabelData(order: any): EquipmentLabelData {
  return {
    workOrderNumber: formatWorkOrderNumber(order),
    equipmentLine: formatEquipmentSummary(order?.equipo),
    clientName: formatShortClientName(order?.client),
    phone: formatShortPhone(order?.client?.telefono),
    orderUrl: buildOrderDetailUrl(order),
  };
}

export function buildEquipmentLabelPrintHtml(
  data: EquipmentLabelData,
  logoSrc = '/images/logo/logo-icon.svg',
  qrDataUrl?: string | null,
): string {
  const ods = escapeHtml(data.workOrderNumber);
  const equipment = escapeHtml(data.equipmentLine);
  const client = escapeHtml(data.clientName);
  const phone = escapeHtml(data.phone);
  const safeLogo = sanitizeLogoSrc(logoSrc);
  const safeQr = sanitizeQrDataUrl(qrDataUrl);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Etiqueta ${ods}</title>
  <style>
    @page {
      size: 50.8mm 25.4mm;
      margin: 0;
    }
    * {
      box-sizing: border-box;
    }
    html, body {
      width: 50.8mm;
      height: 25.4mm;
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #000000;
      font-family: Arial, Helvetica, sans-serif;
      overflow: hidden;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .label-sheet {
      width: 50.8mm;
      height: 25.4mm;
      padding: 1.5mm 2mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      background: #ffffff;
      color: #000000;
      page-break-after: avoid;
      break-after: avoid;
    }
    .top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 0.25mm solid #000000;
      padding-bottom: 0.7mm;
      gap: 1mm;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 1mm;
      min-width: 0;
    }
    .brand-logo {
      width: 3.4mm;
      height: 3.4mm;
      object-fit: contain;
      filter: grayscale(100%) contrast(180%);
      display: block;
      flex-shrink: 0;
    }
    .brand-name {
      font-size: 6.2pt;
      font-weight: 700;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      line-height: 1;
      white-space: nowrap;
    }
    .tag {
      font-size: 5.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      line-height: 1;
      white-space: nowrap;
    }
    .center-block {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      gap: 1.5mm;
      padding: 0.3mm 0;
    }
    .center-info {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 0.6mm;
      min-width: 0;
      flex: 1 1 auto;
    }
    .qr-box {
      width: 11.4mm;
      height: 11.4mm;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr-img {
      width: 11.4mm;
      height: 11.4mm;
      display: block;
      image-rendering: pixelated;
    }
    .ods-number {
      font-size: 11.8pt;
      font-weight: 800;
      line-height: 1.05;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .equipment-line {
      font-size: 7.3pt;
      font-weight: 700;
      line-height: 1.1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .bottom-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      border-top: 0.25mm solid #000000;
      padding-top: 0.7mm;
      gap: 1.2mm;
    }
    .client-name {
      font-size: 7.2pt;
      font-weight: 600;
      line-height: 1.1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
      flex: 1 1 auto;
    }
    .client-phone {
      font-size: 7.2pt;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      line-height: 1.1;
      white-space: nowrap;
      flex-shrink: 0;
    }
  </style>
</head>
<body>
  <div class="label-sheet">
    <div class="top-row">
      <div class="brand">
        <img class="brand-logo" src="${safeLogo}" alt="HDC" />
        <span class="brand-name">HDC Taller</span>
      </div>
      <span class="tag">ID Equipo</span>
    </div>
    <div class="center-block">
      <div class="center-info">
        <div class="ods-number">${ods}</div>
        <div class="equipment-line">${equipment}</div>
      </div>
      ${safeQr ? `<div class="qr-box"><img class="qr-img" src="${safeQr}" alt="QR ${ods}" /></div>` : ''}
    </div>
    <div class="bottom-row">
      <span class="client-name">${client}</span>
      <span class="client-phone">${phone}</span>
    </div>
  </div>
</body>
</html>`;
}
