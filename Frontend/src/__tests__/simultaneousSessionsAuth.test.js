const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

/**
 * Replica exacta de decodeJwtExp y callbacks de Frontend/src/app/api/auth/[...nextauth]/route.ts
 * y validación de expiración de Frontend/src/middleware.ts para pruebas de regresión.
 */
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

function createFakeJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.signature`;
}

async function runJwtCallback({ token, user }) {
  const nextToken = { ...token };
  if (user) {
    nextToken.accessToken = user.token;
    nextToken.user = user.user;
    const exp = decodeJwtExp(user.token);
    if (exp) {
      nextToken.accessTokenExpires = exp * 1000;
    } else {
      nextToken.accessTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
    }
  }
  if (nextToken.accessTokenExpires && Date.now() >= nextToken.accessTokenExpires) {
    nextToken.error = 'AccessTokenExpired';
    nextToken.accessToken = undefined;
  }
  return nextToken;
}

async function runSessionCallback({ session, token }) {
  const nextSession = { ...session };
  if (token.error === 'AccessTokenExpired' || !token.accessToken) {
    nextSession.error = 'AccessTokenExpired';
    nextSession.accessToken = undefined;
  } else {
    nextSession.accessToken = token.accessToken;
  }
  nextSession.user = token.user;
  return nextSession;
}

function isTokenExpiredOrInvalid(token) {
  if (!token || token.error === 'AccessTokenExpired' || !token.accessToken) {
    return true;
  }
  if (typeof token.accessTokenExpires === 'number' && Date.now() >= token.accessTokenExpires) {
    return true;
  }
  return false;
}

test('1-6. Sesiones simultáneas independientes en dos contenedores de cookies (PC y Celular)', async () => {
  const nowSec = Math.floor(Date.now() / 1000);

  // Contenedor aislado Dispositivo A (PC)
  const jwtPc = createFakeJwt({ sub: 77, role: 'tech', exp: nowSec + 86400 });
  let cookieJarPC = await runJwtCallback({
    token: {},
    user: { token: jwtPc, user: { id: 77, role: 'tech', nombre: 'Roberto' } },
  });

  // Contenedor aislado Dispositivo B (Celular)
  const jwtMobile = createFakeJwt({ sub: 77, role: 'tech', exp: nowSec + 86400 + 30 });
  let cookieJarMobile = await runJwtCallback({
    token: {},
    user: { token: jwtMobile, user: { id: 77, role: 'tech', nombre: 'Roberto' } },
  });

  const sessionPC = await runSessionCallback({ session: {}, token: cookieJarPC });
  const sessionMobile = await runSessionCallback({ session: {}, token: cookieJarMobile });

  assert.equal(sessionPC.accessToken, jwtPc);
  assert.equal(sessionMobile.accessToken, jwtMobile);
  assert.notEqual(sessionPC.accessToken, sessionMobile.accessToken);
  assert.equal(isTokenExpiredOrInvalid(cookieJarPC), false);
  assert.equal(isTokenExpiredOrInvalid(cookieJarMobile), false);

  // Cerrar sesión en Dispositivo A (PC) no afecta el contenedor de Dispositivo B (Celular)
  cookieJarPC = null;
  assert.equal(isTokenExpiredOrInvalid(cookieJarPC), true);
  assert.equal(isTokenExpiredOrInvalid(cookieJarMobile), false);
});

test('7 y 11. Expiración individual en un dispositivo y protección en middleware', async () => {
  const nowSec = Math.floor(Date.now() / 1000);

  // Dispositivo A tiene un token expirado hace 60s
  const expiredJwtA = createFakeJwt({ sub: 77, role: 'tech', exp: nowSec - 60 });
  const tokenA = await runJwtCallback({
    token: {},
    user: { token: expiredJwtA, user: { id: 77, role: 'tech' } },
  });
  const sessionA = await runSessionCallback({ session: {}, token: tokenA });

  // Dispositivo B tiene un token válido por 24h
  const validJwtB = createFakeJwt({ sub: 77, role: 'tech', exp: nowSec + 86400 });
  const tokenB = await runJwtCallback({
    token: {},
    user: { token: validJwtB, user: { id: 77, role: 'tech' } },
  });
  const sessionB = await runSessionCallback({ session: {}, token: tokenB });

  assert.equal(sessionA.error, 'AccessTokenExpired');
  assert.equal(sessionA.accessToken, undefined);
  assert.equal(isTokenExpiredOrInvalid(tokenA), true);

  assert.equal(sessionB.error, undefined);
  assert.equal(sessionB.accessToken, validJwtB);
  assert.equal(isTokenExpiredOrInvalid(tokenB), false);
});

test('12, 13 y 14. Verificación estática de manejo de 401/403 deduplicado y ausencia de exposición de tokens en logs', () => {
  const apiSource = fs.readFileSync(path.join(__dirname, '../lib/api.ts'), 'utf8');
  const handlerSource = fs.readFileSync(path.join(__dirname, '../lib/authErrorHandler.ts'), 'utf8');
  const nextAuthSource = fs.readFileSync(
    path.join(__dirname, '../app/api/auth/[...nextauth]/route.ts'),
    'utf8',
  );

  // 403 Forbidden llama a handleForbidden y NO ejecuta signOut
  assert.match(apiSource, /if\s*\(response\.status\s*===\s*403\)/);
  assert.match(apiSource, /authErrorHandler\.handleForbidden/);

  // Deduplicación de notificaciones 401 con toastId único y cerrojo de concurrencia
  assert.match(handlerSource, /toastId:\s*'auth-session-expired'/);
  assert.match(handlerSource, /this\.isHandling401\s*\|\|\s*now\s*-\s*this\.last401Timestamp\s*<\s*this\.LOCK_TIMEOUT_MS/);

  // No se imprimen tokens ni credenciales en logs de NextAuth
  assert.doesNotMatch(nextAuthSource, /console\.log\(.*token/i);
  assert.doesNotMatch(nextAuthSource, /console\.log\(.*password/i);
});

