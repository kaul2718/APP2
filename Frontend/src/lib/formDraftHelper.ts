'use client';

/**
 * Helper para resguardo seguro de borradores de formularios ante expiración de sesión.
 * POLÍTICA DE PRIVACIDAD ESTRICTA:
 * - NUNCA guarda contraseñas, tokens, firmas, imágenes, archivos ni identificadores sensibles.
 * - Solo retiene texto de campos de trabajo en progreso (descripción, problema reportado, observaciones).
 */

const FORBIDDEN_KEY_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /firma/i,
  /file/i,
  /image/i,
  /foto/i,
  /cedula/i,
  /dni/i,
  /auth/i,
  /credential/i,
];

function isSafeKey(key: string): boolean {
  return !FORBIDDEN_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

export function saveSafeDraft<T extends Record<string, any>>(draftKey: string, data: T): void {
  if (typeof window === 'undefined') return;

  try {
    const safeData: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      if (isSafeKey(key) && (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')) {
        // Solo guardar si tiene valor útil y no supera 10KB
        if (typeof value === 'string' && value.length > 0 && value.length < 10000) {
          safeData[key] = value;
        } else if (typeof value !== 'string') {
          safeData[key] = value;
        }
      }
    }

    if (Object.keys(safeData).length > 0) {
      sessionStorage.setItem(`hc_draft_${draftKey}`, JSON.stringify({
        savedAt: Date.now(),
        fields: safeData,
      }));
    }
  } catch (err) {
    // Silencioso ante cuotas de storage
  }
}

export function getSafeDraft<T extends Record<string, any>>(draftKey: string): Partial<T> | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(`hc_draft_${draftKey}`);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    // Borradores válidos por máximo 12 horas
    if (!parsed || !parsed.savedAt || Date.now() - parsed.savedAt > 12 * 60 * 60 * 1000) {
      sessionStorage.removeItem(`hc_draft_${draftKey}`);
      return null;
    }

    return parsed.fields as Partial<T>;
  } catch {
    return null;
  }
}

export function clearSafeDraft(draftKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(`hc_draft_${draftKey}`);
  } catch {}
}
