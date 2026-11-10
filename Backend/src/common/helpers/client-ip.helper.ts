import * as net from 'net';

/**
 * Normaliza una dirección IP eliminando espacios y el prefijo de mapeo IPv6 para IPv4 (::ffff:).
 */
export function normalizeIp(rawIp?: string | null): string {
  if (!rawIp) return '';
  let ip = String(rawIp).trim();
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  return ip;
}

/**
 * Determina si una dirección IP pertenece a localhost, bucle invertido o rangos privados (RFC 1918 / Docker / RFC 4193).
 * Estos rangos identifican proxies inversos locales o de infraestructura interna (como Caddy en Docker o localhost).
 */
export function isPrivateOrLoopbackIp(rawIp?: string | null): boolean {
  const ip = normalizeIp(rawIp);
  if (!ip) return false;

  // Bucle invertido / Localhost
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
    return true;
  }

  // Comprobar rangos privados IPv4
  const parts = ip.split('.').map(Number);
  if (parts.length === 4 && parts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
    // 127.0.0.0/8 (Loopback)
    if (parts[0] === 127) return true;
    // 10.0.0.0/8 (Red Privada Clase A)
    if (parts[0] === 10) return true;
    // 172.16.0.0/12 (Red Privada Clase B / Subredes Docker Bridge estándar 172.17 - 172.31)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16 (Red Privada Clase C)
    if (parts[0] === 192 && parts[1] === 168) return true;
  }

  // Comprobar rangos privados / locales IPv6 (Unique Local fc00::/7 o Link-Local fe80::/10)
  const lower = ip.toLowerCase();
  if (lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd')) {
    return true;
  }

  return false;
}

/**
 * Extrae de forma segura la IP real del cliente considerando la arquitectura con proxy inverso Caddy.
 *
 * Prevención estricta de IP Spoofing:
 * 1. Si la conexión TCP directa (socket.remoteAddress) proviene de un proxy confiable (localhost o red Docker interna):
 *    - Se confía prioritariamente en la cabecera 'x-real-ip', la cual Caddy sobreescribe de manera autoritativa
 *      mediante su directiva `header_up X-Real-IP {remote_host}`.
 *    - Si no existe 'x-real-ip', se extrae el salto confiable de 'x-forwarded-for'.
 * 2. Si la conexión TCP directa NO proviene de un proxy de confianza (p. ej. acceso directo al backend sin pasar por Caddy):
 *    - Se ignoran tajantemente las cabeceras 'x-forwarded-for' y 'x-real-ip' que un atacante pudiera enviar arbitrariamente,
 *      utilizando la IP real del socket TCP para evitar elusión del rate limiting.
 */
export function extractClientIp(req: any): string {
  if (!req) return 'unknown';

  const socketIp = normalizeIp(req.socket?.remoteAddress || req.connection?.remoteAddress || req.ip || '');
  const isTrusted = isPrivateOrLoopbackIp(socketIp);

  if (isTrusted) {
    // 1. Proviene de Caddy / Docker / localhost: Caddy establece header_up X-Real-IP {remote_host}
    const realIpHeader = req.headers?.['x-real-ip'];
    const realIpCandidate = normalizeIp(
      Array.isArray(realIpHeader) ? realIpHeader[0] : (realIpHeader || ''),
    );
    if (realIpCandidate && net.isIP(realIpCandidate) !== 0) {
      return realIpCandidate;
    }

    // 2. Fallback a X-Forwarded-For si no estuviera X-Real-IP
    const xff = req.headers?.['x-forwarded-for'];
    if (xff) {
      const hops = (Array.isArray(xff) ? xff.join(',') : String(xff))
        .split(',')
        .map((h: string) => normalizeIp(h))
        .filter((h: string) => h && net.isIP(h) !== 0);

      if (hops.length > 0) {
        // En proxies encadenados o directiva Caddy, el IP de origen confiable provisto por el proxy
        return hops[hops.length - 1];
      }
    }
  }

  // 3. Conexión directa no confiable: usar socketIp e ignorar cabeceras inyectadas por el cliente
  if (socketIp && net.isIP(socketIp) !== 0) {
    return socketIp;
  }

  return 'unknown';
}
