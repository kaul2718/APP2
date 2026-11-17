const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const trackerSrc = fs.readFileSync(
  path.join(__dirname, '../lib/clientActivityTracker.ts'),
  'utf8',
);
const bannerSrc = fs.readFileSync(
  path.join(__dirname, '../components/privacy/AnalyticsConsentBanner.tsx'),
  'utf8',
);
const navSrc = fs.readFileSync(
  path.join(__dirname, '../data/sidebar/navItems.tsx'),
  'utf8',
);
const auditViewSrc = fs.readFileSync(
  path.join(
    __dirname,
    '../app/(admin)/(others-pages)/actividad-sistema/auditoria/AuditoriaInternaClient.tsx',
  ),
  'utf8',
);
const clientsViewSrc = fs.readFileSync(
  path.join(
    __dirname,
    '../app/(admin)/(others-pages)/actividad-sistema/clientes/ComportamientoClientesClient.tsx',
  ),
  'utf8',
);

test('1. Consentimiento individual obligatorio y banner accesible en portal público', () => {
  assert.match(trackerSrc, /getClientAnalyticsConsentState\(\) === 'granted'/);
  assert.match(trackerSrc, /NEXT_PUBLIC_ENABLE_CLIENT_ANALYTICS === 'false'/);
  assert.match(bannerSrc, /role="dialog"/);
  assert.match(bannerSrc, /Rechazar analítica opcional/);
  assert.match(bannerSrc, /Aceptar medición anónima/);
});

test('2. Navegación lateral agrega Actividad del sistema con permisos audit.view y analytics.clients.view solo para admin', () => {
  assert.match(navSrc, /name:\s*"Actividad del sistema"/);
  assert.match(navSrc, /\/actividad-sistema\/auditoria/);
  assert.match(navSrc, /permission:\s*"audit\.view"/);
  assert.match(navSrc, /\/actividad-sistema\/clientes/);
  assert.match(navSrc, /permission:\s*"analytics\.clients\.view"/);
});

test('3. Vista Auditoría Interna respeta audit.view/audit.detail, es solo lectura y usa Modal max-w-3xl', () => {
  assert.match(auditViewSrc, /hasPermission\('audit\.view'\)/);
  assert.match(auditViewSrc, /hasPermission\('audit\.detail'\)/);
  assert.match(auditViewSrc, /\/audit\/logs\?/);
  assert.match(auditViewSrc, /\/audit\/logs\/\$\{id\}/);
  assert.match(auditViewSrc, /className="max-w-3xl"/);
  assert.doesNotMatch(auditViewSrc, /method:\s*['"](POST|PUT|PATCH|DELETE)['"]/);
});

test('4. Vista Comportamiento de Clientes usa agregaciones SQL, ssr: false y distingue origen Backend vs Frontend', () => {
  assert.match(clientsViewSrc, /hasPermission\('analytics\.clients\.view'\)/);
  assert.match(clientsViewSrc, /dynamic\(\(\) => import\('react-apexcharts'\),\s*\{\s*ssr:\s*false\s*\}\)/);
  assert.match(clientsViewSrc, /\/client-activity\/summary\?/);
  assert.match(clientsViewSrc, /Backend \(Confirmado\)/);
  assert.match(clientsViewSrc, /Frontend \(UX\)/);
  assert.match(clientsViewSrc, /metricsNote/);
});

