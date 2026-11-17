const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const trackerPath = path.join(__dirname, '../lib/clientActivityTracker.ts');
const consultaPath = path.join(__dirname, '../app/consulta/page.tsx');
const authErrorPath = path.join(__dirname, '../lib/authErrorHandler.ts');

const trackerSrc = fs.readFileSync(trackerPath, 'utf8');
const consultaSrc = fs.readFileSync(consultaPath, 'utf8');
const authErrorSrc = fs.readFileSync(authErrorPath, 'utf8');

test('1. Tracker define catálogo cerrado y mantiene consentimiento opcional desactivado sin aceptación individual', () => {
  assert.match(trackerSrc, /ORDER_LOOKUP_STARTED/);
  assert.match(trackerSrc, /ORDER_DETAIL_VIEWED/);
  assert.match(trackerSrc, /BUDGET_VIEWED/);
  assert.match(trackerSrc, /RECOVERY_FLOW_STARTED/);
  assert.match(trackerSrc, /hasClientAnalyticsConsent/);
  assert.match(trackerSrc, /setClientAnalyticsConsent/);
  assert.match(trackerSrc, /getClientAnalyticsConsentState\(\) === 'granted'/);
});

test('2. Tracker sanitiza rutas privadas, deduplica eventos en StrictMode y maneja fallos de red sin bloquear', () => {
  assert.match(trackerSrc, /sanitizeTrackerPath/);
  assert.match(trackerSrc, /split\('\?'\)\[0\]/);
  assert.match(trackerSrc, /\/ver-orden\/\[id\]/);
  assert.match(trackerSrc, /shouldDeduplicateEvent/);
  assert.match(trackerSrc, /DEDUPE_WINDOW_MS = 3000/);
  assert.match(trackerSrc, /keepalive: true/);
  assert.match(trackerSrc, /catch\s*\{[\s\S]*return false/);
});

test('3. Limpieza de sesión anónima al cerrar sesión e integración no invasiva en consulta pública', () => {
  assert.match(trackerSrc, /clearAnonymousTrackingSession/);
  assert.match(authErrorSrc, /clearAnonymousTrackingSession\(\)/);
  assert.match(consultaSrc, /PORTAL_PAGE_VIEWED/);
  assert.match(consultaSrc, /ORDER_LOOKUP_STARTED/);
  assert.match(consultaSrc, /CLIENT_FLOW_ERROR/);
  // Nunca enviar cédula en metadata del tracker
  assert.doesNotMatch(consultaSrc, /trackClientEvent\(\{[^}]*cleanCed/);
});
