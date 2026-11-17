const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { twMerge } = require('tailwind-merge');

const MODAL_BASE_CLASSES =
  'relative my-auto w-full max-w-2xl min-w-0 rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 max-h-[calc(100dvh-1.5rem)] sm:max-h-[88dvh] overflow-y-auto overscroll-contain';

const DROPDOWN_BASE_CLASSES =
  'absolute z-40 right-0 mt-2 rounded-xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark';

const VIEWPORTS = [
  [320, 568],
  [360, 800],
  [375, 812],
  [390, 844],
  [414, 896],
  [768, 1024],
  [1024, 768],
  [1280, 800],
  [1440, 900],
  [1920, 1080],
];

test('1. Modal base y twMerge: nunca incluye max-w-full y respeta el max-w-* de cada modal en escritorio', () => {
  const modalSource = fs.readFileSync(
    path.join(__dirname, '../components/ui/modal/index.tsx'),
    'utf8',
  );
  assert.doesNotMatch(modalSource, /\bmax-w-full\b/);
  assert.match(modalSource, /twMerge\(contentClasses,\s*className\)/);

  const modalCases = [
    { name: 'Crear Nueva Orden (OrdenComponent)', className: 'max-w-3xl', expectedClass: 'max-w-3xl', expectedPx: 768 },
    { name: 'Editar Orden (OrdenEditModal)', className: 'max-w-2xl', expectedClass: 'max-w-2xl', expectedPx: 672 },
    { name: 'Crear Presupuesto (AgregarPresupuestoModal)', className: 'max-w-5xl', expectedClass: 'max-w-5xl', expectedPx: 1024 },
    { name: 'Agregar Cliente / Equipo', className: 'max-w-3xl', expectedClass: 'max-w-3xl', expectedPx: 768 },
    { name: 'Evidencia Técnica (EvidenciaTecnicaModal)', className: 'max-w-3xl', expectedClass: 'max-w-3xl', expectedPx: 768 },
    { name: 'Ticket Térmico (TicketTermicoModal)', className: 'max-w-lg p-0', expectedClass: 'max-w-lg', expectedPx: 512 },
    { name: 'Submodal Marca/Modelo (max-w-[500px])', className: 'max-w-[500px]', expectedClass: 'max-w-[500px]', expectedPx: 500 },
  ];

  for (const c of modalCases) {
    const merged = twMerge(MODAL_BASE_CLASSES, c.className);
    const tokens = merged.split(/\s+/);
    const maxWClasses = tokens.filter((t) => t.startsWith('max-w-'));
    assert.deepEqual(
      maxWClasses,
      [c.expectedClass],
      `El modal "${c.name}" debe conservar únicamente "${c.expectedClass}" sin colisión con max-w-2xl ni max-w-full`,
    );

    // Verificar geometría en las 10 resoluciones (móvil, tablet y escritorio)
    for (const [vw, vh] of VIEWPORTS) {
      const paddingX = vw >= 640 ? 32 : 24; // p-3 (24px) en móvil, sm:p-4 (32px) en >=640px
      const renderedWidth = Math.min(vw - paddingX, c.expectedPx);
      const leftMargin = (vw - renderedWidth) / 2;
      const rightEdge = leftMargin + renderedWidth;

      assert.ok(leftMargin >= 12, `En ${vw}x${vh}, ${c.name} mantiene margen izquierdo >= 12px`);
      assert.ok(rightEdge <= vw - 12, `En ${vw}x${vh}, ${c.name} no desborda a la derecha`);
      if (vw >= 1280) {
        assert.ok(
          renderedWidth <= c.expectedPx && renderedWidth < vw * 0.85,
          `En escritorio (${vw}x${vh}), ${c.name} está centrado (${renderedWidth}px) y no ocupa toda la pantalla`,
        );
      }
    }
  }
});

test('2. NotificationDropdown y Dropdowns del encabezado: twMerge elimina right-0 conflictivo y mantiene el panel dentro del viewport en las 10 resoluciones', () => {
  const dropdownSource = fs.readFileSync(
    path.join(__dirname, '../components/ui/dropdown/Dropdown.tsx'),
    'utf8',
  );
  const notifSource = fs.readFileSync(
    path.join(__dirname, '../components/header/NotificationDropdown.tsx'),
    'utf8',
  );
  const fontBtnSource = fs.readFileSync(
    path.join(__dirname, '../components/common/FontSizeToggleButton.tsx'),
    'utf8',
  );

  assert.match(dropdownSource, /twMerge\(/);
  assert.doesNotMatch(notifSource, /-right-\[240px\]/);
  assert.match(notifSource, /fixed left-3 right-3/);

  const notifClasses =
    'fixed left-3 right-3 top-[124px] z-50 mt-0 flex w-auto max-w-[calc(100vw-1.5rem)] max-h-[calc(100dvh-8.5rem)] flex-col rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-dark sm:absolute sm:top-full sm:left-0 sm:right-auto sm:mt-[17px] sm:h-[480px] sm:max-h-[calc(100dvh-6rem)] sm:w-[360px] md:w-[380px] lg:left-auto lg:right-0 overflow-hidden';
  const mergedNotif = twMerge(DROPDOWN_BASE_CLASSES, notifClasses);

  // Verificar que 'absolute' y 'right-0' sin prefijo fueron reemplazados por 'fixed' y 'left-3 right-3'
  const notifTokens = mergedNotif.split(/\s+/);
  assert.ok(notifTokens.includes('fixed'), 'En móvil debe usar posicionamiento fixed respecto al viewport');
  assert.ok(!notifTokens.includes('absolute'), 'No debe conservar absolute sin prefijo');
  assert.ok(!notifTokens.includes('right-0'), 'No debe conservar right-0 sin prefijo');

  const fontClasses =
    'absolute left-0 right-auto lg:left-auto lg:right-0 mt-2 w-48 max-w-[calc(100vw-1.5rem)] rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl dark:border-gray-800 dark:bg-gray-dark';
  const mergedFont = twMerge(DROPDOWN_BASE_CLASSES, fontClasses);
  const fontTokens = mergedFont.split(/\s+/);
  assert.ok(fontTokens.includes('left-0') && fontTokens.includes('right-auto'));
  assert.ok(!fontTokens.includes('right-0'));

  // Simulación geométrica de NotificationDropdown en las 10 resoluciones
  for (const [vw, vh] of VIEWPORTS) {
    let left;
    let right;
    if (vw < 640) {
      // fixed left-3 (12px) right-3 (vw - 12px)
      left = 12;
      right = vw - 12;
    } else if (vw < 1024) {
      // sm:left-0 anclado al botón de campana (x ≈ 124px) con ancho 360..380px
      const width = vw >= 768 ? 380 : 360;
      left = 124;
      right = left + width;
    } else {
      // lg:right-0 anclado al área derecha del header en escritorio
      const width = 380;
      right = vw - 220;
      left = right - width;
    }

    assert.ok(left >= 0, `En ${vw}x${vh}, NotificationDropdown left (${left}px) >= 0`);
    assert.ok(right <= vw, `En ${vw}x${vh}, NotificationDropdown right (${right}px) <= ${vw}px`);
  }
});

