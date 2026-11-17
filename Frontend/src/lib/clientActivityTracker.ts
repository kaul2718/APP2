export const CLIENT_ACTIVITY_EVENTS = [
  'ORDER_LOOKUP_STARTED',
  'ORDER_LOOKUP_SUCCESS',
  'ORDER_LOOKUP_NOT_FOUND',
  'ORDER_DETAIL_VIEWED',
  'ORDER_STATUS_HISTORY_VIEWED',
  'DIAGNOSIS_VIEWED',
  'BUDGET_VIEWED',
  'BUDGET_APPROVAL_STARTED',
  'BUDGET_APPROVAL_CANCELLED',
  'EVIDENCE_SECTION_VIEWED',
  'DOCUMENT_DOWNLOAD_STARTED',
  'PORTAL_PAGE_VIEWED',
  'PORTAL_SECTION_VIEWED',
  'CLIENT_FLOW_ERROR',
  'RECOVERY_FLOW_STARTED',
] as const;

export type ClientActivityEventName = (typeof CLIENT_ACTIVITY_EVENTS)[number];

export type ClientActivityModule =
  | 'portal_publico'
  | 'portal_cliente'
  | 'presupuestos'
  | 'evidencias'
  | 'recuperacion'
  | 'navegacion';

export interface TrackClientEventInput {
  eventName: ClientActivityEventName;
  module: ClientActivityModule;
  pagePath?: string;
  entityType?: string;
  entityId?: string | number;
  metadata?: Record<string, string | number | boolean>;
  accessToken?: string | null;
}

const CONSENT_STORAGE_KEY = 'hdc_analytics_consent';
const ANON_SESSION_STORAGE_KEY = 'hdc_client_session_id';
const DEDUPE_WINDOW_MS = 3000;

const recentEventsMap = new Map<string, number>();

export function getClientAnalyticsConsentState(): 'granted' | 'denied' | 'unset' {
  if (typeof window === 'undefined') return 'unset';
  try {
    const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored === 'granted') return 'granted';
    if (stored === 'denied') return 'denied';
  } catch {
    return 'unset';
  }
  return 'unset';
}

export function hasClientAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  // Si está deshabilitado globalmente de forma explícita, respetar el bloqueo
  if (process.env.NEXT_PUBLIC_ENABLE_CLIENT_ANALYTICS === 'false') {
    return false;
  }
  // Exigir consentimiento individual explícito ('granted'); nunca activar por defecto sin decisión del usuario
  return getClientAnalyticsConsentState() === 'granted';
}

export function setClientAnalyticsConsent(granted: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, granted ? 'granted' : 'denied');
    if (!granted) {
      window.sessionStorage.removeItem(ANON_SESSION_STORAGE_KEY);
      recentEventsMap.clear();
    }
  } catch {
    // ignore storage errors
  }
}

export function clearAnonymousTrackingSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(ANON_SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function getOrCreateAnonymousSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  if (!hasClientAnalyticsConsent()) return null;

  try {
    let sid = window.sessionStorage.getItem(ANON_SESSION_STORAGE_KEY);
    if (!sid) {
      sid =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      window.sessionStorage.setItem(ANON_SESSION_STORAGE_KEY, sid);
    }
    return sid;
  } catch {
    return null;
  }
}

export function sanitizeTrackerPath(rawPath?: string): string {
  const source =
    rawPath ||
    (typeof window !== 'undefined' ? window.location.pathname : '/');
  const withoutOrigin = String(source).replace(/^https?:\/\/[^/]+/i, '');
  const pathOnly = withoutOrigin.split('?')[0].split('#')[0] || '/';
  const normalized = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
  return normalized.replace(/\/ver-orden\/\d+/g, '/ver-orden/[id]').slice(0, 200);
}

export function shouldDeduplicateEvent(dedupeKey: string, now = Date.now()): boolean {
  const lastAt = recentEventsMap.get(dedupeKey);
  if (lastAt !== undefined && now - lastAt < DEDUPE_WINDOW_MS) {
    return true;
  }
  recentEventsMap.set(dedupeKey, now);
  if (recentEventsMap.size > 200) {
    for (const [k, ts] of recentEventsMap.entries()) {
      if (now - ts >= DEDUPE_WINDOW_MS) {
        recentEventsMap.delete(k);
      }
    }
  }
  return false;
}

export async function trackClientEvent(
  input: TrackClientEventInput,
): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!hasClientAnalyticsConsent()) return false;
  if (!CLIENT_ACTIVITY_EVENTS.includes(input.eventName)) return false;

  const pagePath = sanitizeTrackerPath(input.pagePath);
  const dedupeKey = `${input.eventName}:${input.module}:${pagePath}:${input.entityId ?? ''}`;
  if (shouldDeduplicateEvent(dedupeKey)) {
    return false;
  }

  const sessionId = input.accessToken ? null : getOrCreateAnonymousSessionId();
  const backendBase =
    process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api/v1';

  const payload = {
    events: [
      {
        eventName: input.eventName,
        module: input.module,
        pagePath,
        ...(sessionId ? { sessionId } : {}),
        ...(input.accessToken && input.entityType ? { entityType: input.entityType } : {}),
        ...(input.accessToken && input.entityId !== undefined
          ? { entityId: String(input.entityId) }
          : {}),
        ...(input.metadata ? { metadata: input.metadata } : {}),
        frontendVersion: process.env.NEXT_PUBLIC_APP_VERSION || '2.0.2',
      },
    ],
  };

  try {
    // Re-validar consentimiento inmediatamente antes del envío de red
    if (!hasClientAnalyticsConsent()) return false;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (input.accessToken) {
      headers.Authorization = `Bearer ${input.accessToken}`;
    }

    const res = await fetch(`${backendBase}/client-activity/events`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      keepalive: true,
    });
    return res.ok;
  } catch {
    // Nunca interrumpir la experiencia del cliente si falla el endpoint de analítica
    return false;
  }
}

