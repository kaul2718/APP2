export const CLIENT_ACTIVITY_EVENTS = [
  // Consulta de órdenes
  'ORDER_LOOKUP_STARTED',
  'ORDER_LOOKUP_SUCCESS',
  'ORDER_LOOKUP_NOT_FOUND',
  'ORDER_DETAIL_VIEWED',
  'ORDER_STATUS_HISTORY_VIEWED',
  // Información técnica y presupuestos
  'DIAGNOSIS_VIEWED',
  'BUDGET_VIEWED',
  'BUDGET_APPROVAL_STARTED',
  'BUDGET_APPROVAL_CANCELLED',
  'EVIDENCE_SECTION_VIEWED',
  'DOCUMENT_DOWNLOAD_STARTED',
  // Navegación, recuperación y errores
  'PORTAL_PAGE_VIEWED',
  'PORTAL_SECTION_VIEWED',
  'CLIENT_FLOW_ERROR',
  'RECOVERY_FLOW_STARTED',
] as const;

export type ClientActivityEventName = (typeof CLIENT_ACTIVITY_EVENTS)[number];

export const CLIENT_ACTIVITY_MODULES = [
  'portal_publico',
  'portal_cliente',
  'presupuestos',
  'evidencias',
  'recuperacion',
  'navegacion',
] as const;

export type ClientActivityModule = (typeof CLIENT_ACTIVITY_MODULES)[number];

export const ALLOWED_METADATA_KEYS_BY_EVENT: Record<
  ClientActivityEventName,
  readonly string[]
> = {
  ORDER_LOOKUP_STARTED: ['channel'],
  ORDER_LOOKUP_SUCCESS: ['orderType', 'step'],
  ORDER_LOOKUP_NOT_FOUND: ['reason'],
  ORDER_DETAIL_VIEWED: ['orderType', 'step'],
  ORDER_STATUS_HISTORY_VIEWED: ['stepsCount'],
  DIAGNOSIS_VIEWED: ['hasActivities'],
  BUDGET_VIEWED: ['budgetStatus'],
  BUDGET_APPROVAL_STARTED: ['decision'],
  BUDGET_APPROVAL_CANCELLED: ['decision'],
  EVIDENCE_SECTION_VIEWED: ['filterStatus', 'itemsCount'],
  DOCUMENT_DOWNLOAD_STARTED: ['documentType'],
  PORTAL_PAGE_VIEWED: ['section'],
  PORTAL_SECTION_VIEWED: ['section'],
  CLIENT_FLOW_ERROR: ['errorCode', 'flow'],
  RECOVERY_FLOW_STARTED: ['channel'],
};

const SENSITIVE_PATH_OR_META_PATTERNS = [
  /token=/i,
  /cedula=/i,
  /password/i,
  /secret/i,
  /authorization/i,
  /signature/i,
  /firma/i,
];

export function sanitizePagePath(rawPath: string): string {
  const trimmed = String(rawPath || '/').trim();
  const withoutOrigin = trimmed.replace(/^https?:\/\/[^/]+/i, '');
  const pathOnly = withoutOrigin.split('?')[0].split('#')[0] || '/';
  const normalized = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
  return normalized.slice(0, 200);
}

export function sanitizeEventMetadata(
  eventName: ClientActivityEventName,
  rawMeta?: Record<string, unknown> | null,
): Record<string, string | number | boolean> | null {
  if (!rawMeta || typeof rawMeta !== 'object' || Array.isArray(rawMeta)) {
    return null;
  }

  const allowedKeys = ALLOWED_METADATA_KEYS_BY_EVENT[eventName] || [];
  const out: Record<string, string | number | boolean> = {};

  for (const key of allowedKeys) {
    if (!Object.prototype.hasOwnProperty.call(rawMeta, key)) continue;
    const val = rawMeta[key];
    if (val === undefined || val === null) continue;

    if (typeof val === 'number' && Number.isFinite(val)) {
      out[key] = val;
    } else if (typeof val === 'boolean') {
      out[key] = val;
    } else if (typeof val === 'string') {
      const clean = val.trim().slice(0, 80);
      if (
        clean.length > 0 &&
        !SENSITIVE_PATH_OR_META_PATTERNS.some((re) => re.test(clean)) &&
        !/^\d{10,13}$/.test(clean) &&
        !/@/.test(clean)
      ) {
        out[key] = clean;
      }
    }
  }

  return Object.keys(out).length > 0 ? out : null;
}

