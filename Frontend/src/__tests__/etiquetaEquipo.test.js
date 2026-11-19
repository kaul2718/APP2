const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('../../node_modules/typescript');
const QRCode = require('../../node_modules/qrcode');

function loadEtiquetaModule() {
  const tsPath = path.join(__dirname, '../lib/etiquetaEquipo.ts');
  const source = fs.readFileSync(tsPath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const mod = { exports: {} };
  const fn = new Function('exports', 'require', 'module', transpiled.outputText);
  fn(mod.exports, require, mod);
  return mod.exports;
}

const etiqueta = loadEtiquetaModule();

test('1. ODS normal con datos cortos mantiene ODS completa y formato limpio', () => {
  const order = {
    id: 123,
    workOrderNumber: 'ODS-000123',
    client: {
      nombre: 'Juan',
      apellido: 'Pérez',
      telefono: '0982123456',
    },
    equipo: {
      tipoEquipo: { nombre: 'Laptop' },
      marca: { nombre: 'Lenovo' },
    },
  };

  const data = etiqueta.buildEquipmentLabelData(order);
  assert.equal(data.workOrderNumber, 'ODS-000123');
  assert.equal(data.equipmentLine, 'Laptop · Lenovo');
  assert.equal(data.clientName, 'Juan Pérez');
  assert.equal(data.phone, '0982123456');
});

test('2. Cliente con nombre compuesto y extremadamente largo se resume sin desbordar', () => {
  const shortCompound = etiqueta.formatShortClientName({
    nombre: 'KAMILA DENNYS',
    apellido: 'AMORES TORRES',
  });
  assert.equal(shortCompound, 'Kamila Amores');

  const veryLong = etiqueta.formatShortClientName({
    nombre: 'Maximiliano Alejandro',
    apellido: 'Villavicencio-Montenegro',
  });
  assert.ok(veryLong.startsWith('M. '), `Esperado formato inicial, recibido: ${veryLong}`);
  assert.ok(veryLong.length <= 21, `Longitud excede 21: ${veryLong.length}`);
});

test('3. Marca y tipo de equipo extremadamente largos se abrevian/truncan de forma legible', () => {
  const line = etiqueta.formatEquipmentSummary({
    tipoEquipo: { nombre: 'Computadora de Escritorio Gamer' },
    marca: { nombre: 'Hewlett-Packard Enterprise' },
  });
  assert.ok(line.startsWith('PC Escritorio · '), `Recibido: ${line}`);
  assert.ok(line.length <= 28, `Longitud excede 28: ${line.length}`);
});

test('4. Caracteres especiales y payload XSS se escapan completamente en el HTML imprimible', () => {
  const order = {
    id: 500,
    workOrderNumber: 'ODS-000500',
    client: {
      nombre: 'Ñoño <script>alert(1)</script>',
      apellido: "O'Connor & Co",
      telefono: '099-123-4567',
    },
    equipo: {
      tipoEquipo: { nombre: 'Laptop "Pro"' },
      marca: { nombre: 'ASUS & ROG' },
    },
  };

  const data = etiqueta.buildEquipmentLabelData(order);
  const html = etiqueta.buildEquipmentLabelPrintHtml(data, 'https://elhospitaldelcomputador.com/images/logo/logo-icon.svg');

  assert.ok(!html.includes('<script>'), 'No debe inyectar etiquetas <script>');
  assert.ok(html.includes('&lt;script&gt;') || !html.includes('alert(1)'), 'Contenido peligroso debe ir escapado');
  assert.ok(html.includes('&amp;'), 'Debe escapar & correctamente');
});

test('5. Celular largo o ausente se maneja sin romper el layout', () => {
  assert.equal(etiqueta.formatShortPhone(null), 'Sin tel.');
  assert.equal(etiqueta.formatShortPhone(''), 'Sin tel.');
  const longPhone = etiqueta.formatShortPhone('+593 99 123 4567890123');
  assert.ok(longPhone.length <= 13, `Celular demasiado largo: ${longPhone}`);
});

test('6. HTML de impresión define tamaño exacto 50.8mm x 25.4mm, URL real sin localhost y QR nítido en área central', async () => {
  const prevSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:4000';
  const orderUrl = etiqueta.buildOrderDetailUrl({ id: 12750 });
  if (prevSiteUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = prevSiteUrl;
  }

  assert.equal(orderUrl, 'https://elhospitaldelcomputador.com/ver-orden/12750');
  assert.ok(!orderUrl.includes('localhost'), 'La URL del QR nunca debe usar localhost');

  const qrDataUrl = await QRCode.toDataURL(orderUrl, {
    width: 256,
    margin: 1,
    errorCorrectionLevel: 'M',
  });
  assert.ok(qrDataUrl.startsWith('data:image/png;base64,'));
  assert.equal(etiqueta.sanitizeQrDataUrl('javascript:alert(1)'), null);

  const html = etiqueta.buildEquipmentLabelPrintHtml(
    {
      workOrderNumber: 'ODS-000999',
      equipmentLine: 'Laptop · HP',
      clientName: 'María López',
      phone: '0987654321',
      orderUrl,
    },
    '/images/logo/logo-icon.svg',
    qrDataUrl,
  );

  assert.ok(html.includes('size: 50.8mm 25.4mm;'), 'Debe configurar @page 50.8mm 25.4mm');
  assert.ok(html.includes('margin: 0;'), 'Debe eliminar encabezados/pies de página con margin: 0');
  assert.ok(html.includes('width: 50.8mm;'), 'Debe fijar ancho 50.8mm');
  assert.ok(html.includes('height: 25.4mm;'), 'Debe fijar alto 25.4mm');
  assert.ok(html.includes('overflow: hidden;'), 'Debe evitar salto a una segunda página');
  assert.ok(html.includes('/images/logo/logo-icon.svg'), 'Debe usar el isotipo SVG oficial');
  assert.ok(html.includes('ID Equipo'), 'Debe conservar el texto ID Equipo en el encabezado');
  assert.ok(html.includes('class="qr-box"') && html.includes(qrDataUrl), 'Debe incluir el QR dinámico en el área central');
});

test('7. Modal e integración: sin autoimpresión al guardar, espera carga SVG, reimpresión sin crear ODS y Ticket 80mm intacto', () => {
  const modalPath = path.join(__dirname, '../components/modals/EtiquetaEquipoModal.tsx');
  const modalCode = fs.readFileSync(modalPath, 'utf8');
  assert.ok(modalCode.includes('2× Lectura') && modalCode.includes('1:1 (50.8×25.4 mm)'), 'Debe ofrecer vista previa ampliada y a escala 1:1');
  assert.ok(!modalCode.includes('useEffect(() => {\n    handlePrint'), 'No debe imprimir automáticamente al abrir/guardar');
  assert.ok(modalCode.includes("img.addEventListener('load'"), 'Debe esperar la carga del SVG antes de imprimir');
  assert.ok(!modalCode.includes('/orders'), 'La reimpresión no debe crear nuevas ODS ni mutar datos');

  const ordenCreadaCode = fs.readFileSync(path.join(__dirname, '../components/modals/OrdenCreadaModal.tsx'), 'utf8');
  assert.ok(ordenCreadaCode.includes('onOpenEtiquetaModal'), 'OrdenCreadaModal debe integrar botón Imprimir Etiqueta');

  const detailCode = fs.readFileSync(
    path.join(__dirname, '../app/(admin)/(others-pages)/(ordenes)/ver-orden/[id]/page.tsx'),
    'utf8',
  );
  assert.ok(detailCode.includes('Reimprimir Etiqueta'), 'Detalle de orden debe incluir Reimprimir Etiqueta');
  assert.ok(detailCode.includes('canPrintEquipmentLabel'), 'Reimprimir Etiqueta debe respetar permisos operativos multirrol');

  const ticketCode = fs.readFileSync(path.join(__dirname, '../components/modals/TicketTermicoModal.tsx'), 'utf8');
  assert.ok(ticketCode.includes('/documentos/ticket-termico'), 'TicketTermicoModal de 80 mm debe permanecer intacto');
  assert.ok(!ticketCode.includes('EtiquetaEquipo'), 'TicketTermicoModal no debe mezclarse con la etiqueta 2x1');
});

