/**
 * Configuración centralizada de SEO, Dominio y Metadatos para Hospital del Computador.
 * 
 * Reglas de diseño:
 * 1. Lee NEXT_PUBLIC_SITE_URL centralizadamente.
 * 2. Si no hay dominio configurado en el entorno, NO inventa URLs ficticias ni
 *    asume producción.
 * 3. Evita hardcodear localhost en metadatos para producción.
 */

export function getRawSiteUrl(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw || typeof raw !== 'string') return undefined;
  const trimmed = raw.trim().replace(/\/$/, '');
  return trimmed.length > 0 ? trimmed : undefined;
}

export function getBaseUrl(): string {
  return getRawSiteUrl() || '';
}

export function getCanonicalUrl(path: string = '/'): string {
  const base = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${cleanPath}` : cleanPath;
}

export function getMetadataBase(): URL | undefined {
  const raw = getRawSiteUrl();
  if (!raw) return undefined;
  try {
    return new URL(raw);
  } catch {
    return undefined;
  }
}

export function getAbsoluteOrRelativeUrl(path: string): string {
  const base = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${cleanPath}` : cleanPath;
}
