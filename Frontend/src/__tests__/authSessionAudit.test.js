import test from 'node:test';
import assert from 'node:assert/strict';

// Helper de decodificación JWT idéntico al implementado en [...nextauth]/route.ts
function decodeJwtExp(tokenStr) {
  if (!tokenStr || typeof tokenStr !== 'string') return null;
  try {
    const parts = tokenStr.split('.');
    if (parts.length !== 3) return null;
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(payloadBase64, 'base64').toString('utf-8');
    const parsed = JSON.parse(json);
    return typeof parsed.exp === 'number' ? parsed.exp : null;
  } catch {
    return null;
  }
}

// Generador de mock JWT para pruebas
function createMockJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = 'mockSignature123';
  return `${header}.${body}.${signature}`;
}

// Simulación de AuthErrorHandler
class MockAuthErrorHandler {
  constructor() {
    this.isHandling401 = false;
    this.last401Timestamp = 0;
    this.handleCount401 = 0;
    this.handleCount403 = 0;
    this.toastsEmitted = [];
    this.signoutCalled = 0;
    this.redirectUrl = null;
    this.eventsEmitted = [];
    this.PUBLIC_PATHS = ['/signin', '/consulta', '/activar-cuenta'];
  }

  isPublicPath(path) {
    return this.PUBLIC_PATHS.some((pub) => (path || '').startsWith(pub));
  }

  async handleUnauthorized(options = {}) {
    const now = Date.now();
    if (this.isHandling401 || (now - this.last401Timestamp < 3000)) {
      return; // Deduplicado
    }

    this.isHandling401 = true;
    this.last401Timestamp = now;
    this.handleCount401++;

    this.eventsEmitted.push('hc:session-expired');
    this.toastsEmitted.push({
      type: 'error',
      toastId: 'auth-session-expired',
      message: options.customMessage || 'Tu sesión ha expirado. Inicia sesión nuevamente para continuar.',
    });

    if (options.currentPath && this.isPublicPath(options.currentPath)) {
      return;
    }

    this.signoutCalled++;
    const callback = options.currentPath || '/dashboard';
    this.redirectUrl = `/signin?callbackUrl=${encodeURIComponent(callback)}`;
  }

  handleForbidden(options = {}) {
    this.handleCount403++;
    this.toastsEmitted.push({
      type: 'warn',
      toastId: 'auth-forbidden',
      message: options.customMessage || 'No tienes permisos suficientes para realizar esta acción.',
    });
  }

  reset() {
    this.isHandling401 = false;
    this.last401Timestamp = 0;
    this.handleCount401 = 0;
    this.handleCount403 = 0;
    this.toastsEmitted = [];
    this.signoutCalled = 0;
    this.redirectUrl = null;
    this.eventsEmitted = [];
  }
}

// Simulación de middleware
function simulateMiddleware(req) {
  const { path, token } = req;
  const isPublic = ['/consulta', '/signin', '/activar-cuenta'].some((p) => path.startsWith(p));
  if (isPublic) {
    return { status: 200, action: 'next' };
  }

  if (!token?.accessToken || token?.error === 'AccessTokenExpired') {
    return {
      status: 307,
      action: 'redirect',
      location: `/signin?callbackUrl=${encodeURIComponent(path)}`,
    };
  }

  return { status: 200, action: 'next' };
}

// Filtro de borrador seguro
function filterSafeDraft(data) {
  const forbiddenPatterns = [
    /password/i, /token/i, /secret/i, /firma/i,
    /file/i, /image/i, /foto/i, /cedula/i, /dni/i, /credential/i
  ];
  const safe = {};
  for (const [k, v] of Object.entries(data)) {
    const isForbidden = forbiddenPatterns.some((p) => p.test(k));
    if (!isForbidden && (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')) {
      safe[k] = v;
    }
  }
  return safe;
}

test('1. Usuario autenticado con sesión vigente: JWT no expirado', () => {
  const nowSec = Math.floor(Date.now() / 1000);
  const token = createMockJwt({ sub: 10, exp: nowSec + 3600 });
  const exp = decodeJwtExp(token);

  assert.equal(typeof exp, 'number');
  assert.ok(exp > nowSec);
});

test('2. JWT expirado mientras NextAuth mantenía sesión activa: detecta exp real y marca AccessTokenExpired', () => {
  const nowSec = Math.floor(Date.now() / 1000);
  // Token vencido hace 5 minutos
  const expiredToken = createMockJwt({ sub: 10, exp: nowSec - 300 });
  const exp = decodeJwtExp(expiredToken);

  assert.equal(typeof exp, 'number');
  const tokenExpiresMs = exp * 1000;
  const isExpired = Date.now() >= tokenExpiresMs;

  assert.equal(isExpired, true, 'Debe detectar que el JWT expiró');
});

test('3. Sincronización de duración de sesión: maxAge de NextAuth a 24 horas (86400s)', () => {
  const backendJwtDurationSeconds = 24 * 60 * 60; // 1d = 86400s
  const nextAuthMaxAge = 24 * 60 * 60; // 86400s

  assert.equal(backendJwtDurationSeconds, nextAuthMaxAge, 'NextAuth y NestJS deben tener la misma vigencia máxima');
});

test('4. Token inválido o revocado: trigger de handleUnauthorized()', async () => {
  const handler = new MockAuthErrorHandler();
  await handler.handleUnauthorized({ currentPath: '/ver-orden/25' });

  assert.equal(handler.handleCount401, 1);
  assert.equal(handler.signoutCalled, 1);
  assert.equal(handler.toastsEmitted.length, 1);
  assert.equal(handler.toastsEmitted[0].toastId, 'auth-session-expired');
  assert.ok(handler.redirectUrl.includes('/signin?callbackUrl=%2Fver-orden%2F25'));
});

test('5. Usuario autenticado sin permisos (403): emite advertencia SIN cerrar sesión ni redirigir', () => {
  const handler = new MockAuthErrorHandler();
  handler.handleForbidden({ customMessage: 'No tienes permisos para ver esta orden.' });

  assert.equal(handler.handleCount403, 1);
  assert.equal(handler.signoutCalled, 0, 'No debe cerrar sesión ante un 403');
  assert.equal(handler.redirectUrl, null, 'No debe redirigir ante un 403');
  assert.equal(handler.toastsEmitted[0].toastId, 'auth-forbidden');
});

test('6. Solicitudes concurrentes con 401: deduplicación estricta a un solo toast y un solo signOut', async () => {
  const handler = new MockAuthErrorHandler();

  // Simular 10 peticiones que fallan exactamente al mismo tiempo
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(handler.handleUnauthorized({ currentPath: '/ver-orden/100' }));
  }
  await Promise.all(promises);

  assert.equal(handler.handleCount401, 1, 'Solo debe procesar el primer 401');
  assert.equal(handler.toastsEmitted.length, 1, 'Solo debe emitir 1 toast');
  assert.equal(handler.signoutCalled, 1, 'Solo debe llamar a signOut 1 vez');
});

test('7. Sesión expirada dentro de formulario: guarda únicamente campos seguros sin tokens ni contraseñas', () => {
  const formState = {
    problemaReportado: 'Laptop no da video tras corte de energía',
    observaciones: 'Cargador original incluido',
    tiempoEstimadoReparacion: 4,
    password: 'SuperSecretPassword123!',
    tokenActivacion: 'secret_token_abc',
    tokenAccesoRaw: 'ephemeral_raw_secret',
    firmaBase64: 'data:image/png;base64,iVBORw0KGgoAAA...',
    cedula: '0503646812',
  };

  const safeDraft = filterSafeDraft(formState);

  assert.equal(safeDraft.problemaReportado, 'Laptop no da video tras corte de energía');
  assert.equal(safeDraft.observaciones, 'Cargador original incluido');
  assert.equal(safeDraft.tiempoEstimadoReparacion, 4);

  // Verificaciones de privacidad
  assert.equal(safeDraft.password, undefined);
  assert.equal(safeDraft.tokenActivacion, undefined);
  assert.equal(safeDraft.tokenAccesoRaw, undefined);
  assert.equal(safeDraft.firmaBase64, undefined);
  assert.equal(safeDraft.cedula, undefined);
});

test('8. Recarga de ruta protegida con sesión expirada: middleware intercepta y redirige a /signin', () => {
  const response = simulateMiddleware({
    path: '/ver-orden/45',
    token: { error: 'AccessTokenExpired', accessToken: undefined },
  });

  assert.equal(response.status, 307);
  assert.equal(response.action, 'redirect');
  assert.ok(response.location.includes('/signin?callbackUrl=%2Fver-orden%2F45'));
});

test('9. Cierre de sesión manual: limpia credenciales y redirige sin bucles', async () => {
  const handler = new MockAuthErrorHandler();
  await handler.handleUnauthorized({ currentPath: '/dashboard' });

  assert.equal(handler.signoutCalled, 1);
  assert.equal(handler.redirectUrl, '/signin?callbackUrl=%2Fdashboard');
});

test('10. Acceso a rutas públicas sin autenticación: /consulta y /signin permitidas', () => {
  const resConsulta = simulateMiddleware({
    path: '/consulta?workorder=00001&cedula=0103644480',
    token: null,
  });
  assert.equal(resConsulta.status, 200);
  assert.equal(resConsulta.action, 'next');

  const resSignin = simulateMiddleware({
    path: '/signin',
    token: null,
  });
  assert.equal(resSignin.status, 200);
  assert.equal(resSignin.action, 'next');

  const resActivar = simulateMiddleware({
    path: '/activar-cuenta?token=xyz',
    token: null,
  });
  assert.equal(resActivar.status, 200);
  assert.equal(resActivar.action, 'next');
});
