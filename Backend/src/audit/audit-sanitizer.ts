const MAX_JSONB_BYTES = 16384; // 16 KB por payload JSONB
const MAX_STRING_LENGTH = 500;

const SENSITIVE_KEY_PATTERNS = [
  'password',
  'contraseña',
  'contrasena',
  'hash',
  'token',
  'secret',
  'cookie',
  'authorization',
  'apikey',
  'api_key',
  'archivourl',
  'signedurl',
  'uploadurl',
  'firmabase64',
  'firma',
  'signature',
  'credential',
  'privatekey',
];

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[^a-z0-9_]/g, '');
  return SENSITIVE_KEY_PATTERNS.some((pattern) => normalized.includes(pattern));
}

export function maskEmail(email: string): string {
  const trimmed = String(email || '').trim();
  const atIndex = trimmed.indexOf('@');
  if (atIndex <= 1) return '***';
  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);
  return `${local[0]}***${local.slice(-1)}@${domain}`;
}

export function maskIdentifier(value: string): string {
  const s = String(value || '').trim();
  if (s.length <= 4) return '****';
  return `${s.slice(0, 3)}***${s.slice(-3)}`;
}

function sanitizeValue(key: string, value: unknown, depth = 0): unknown {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (depth > 4) return '[TRUNCATED_DEPTH]';

  const lowerKey = key.toLowerCase();
  if (isSensitiveKey(lowerKey)) {
    return '[REDACTED]';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    if (lowerKey.includes('correo') || lowerKey.includes('email')) {
      return maskEmail(value);
    }
    if (
      lowerKey === 'cedula' ||
      lowerKey === 'ruc' ||
      lowerKey === 'telefono' ||
      lowerKey === 'identificador'
    ) {
      return maskIdentifier(value);
    }
    if (value.startsWith('data:image/') || value.startsWith('data:video/')) {
      return '[REDACTED_DATA_URL]';
    }
    if (value.length > MAX_STRING_LENGTH) {
      return `${value.slice(0, MAX_STRING_LENGTH)}…`;
    }
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => sanitizeValue(key, item, depth + 1));
  }

  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const sanitized = sanitizeValue(k, v, depth + 1);
      if (sanitized !== undefined) {
        out[k] = sanitized;
      }
    }
    return out;
  }

  return String(value).slice(0, MAX_STRING_LENGTH);
}

export function sanitizeAuditPayload(
  payload?: Record<string, any> | null,
  allowedKeys?: string[],
): Record<string, any> | null {
  if (!payload || typeof payload !== 'object') return null;

  const filtered: Record<string, any> = {};
  const entries = Object.entries(payload);

  for (const [key, val] of entries) {
    if (allowedKeys && allowedKeys.length > 0 && !allowedKeys.includes(key)) {
      continue;
    }
    if (isSensitiveKey(key)) {
      continue;
    }
    const sanitized = sanitizeValue(key, val, 0);
    if (sanitized !== undefined) {
      filtered[key] = sanitized;
    }
  }

  if (Object.keys(filtered).length === 0) return null;

  const serialized = JSON.stringify(filtered);
  if (Buffer.byteLength(serialized, 'utf8') > MAX_JSONB_BYTES) {
    return {
      _truncated: true,
      _originalBytes: Buffer.byteLength(serialized, 'utf8'),
      keys: Object.keys(filtered).slice(0, 30),
    };
  }

  return filtered;
}

export function computeChangedFields(
  oldValues?: Record<string, any> | null,
  newValues?: Record<string, any> | null,
  explicitChangedFields?: string[],
): string[] | null {
  if (explicitChangedFields && explicitChangedFields.length > 0) {
    return Array.from(new Set(explicitChangedFields)).slice(0, 50);
  }
  if (!oldValues && !newValues) return null;

  const keys = new Set([
    ...Object.keys(oldValues || {}),
    ...Object.keys(newValues || {}),
  ]);

  const changed: string[] = [];
  for (const key of keys) {
    if (key.startsWith('_')) continue;
    const prev = oldValues ? oldValues[key] : undefined;
    const next = newValues ? newValues[key] : undefined;
    if (JSON.stringify(prev) !== JSON.stringify(next)) {
      changed.push(key);
    }
  }

  return changed.length > 0 ? changed : null;
}

