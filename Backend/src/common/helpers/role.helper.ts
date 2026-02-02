/**
 * Role Helper - Spatie Style
 * 
 * Sistema centralizado de roles sin enum.
 * Los roles son administrados 100% desde BD.
 * Este helper valida y convierte roles.
 */

/**
 * Roles válidos del sistema (mapeado a BD)
 * Estos corresponden a los slugs en la tabla rol
 */
export const VALID_ROLES = {
  ADMIN: 'admin',
  TECH: 'tech',
  RECEP: 'recep',
  CLIENT: 'client',
  USER: 'user',
} as const;

/**
 * Type para roles válidos (type-safe strings)
 */
export type ValidRole = (typeof VALID_ROLES)[keyof typeof VALID_ROLES];

/**
 * Nombres descriptivos de roles (para UI/logs)
 */
export const ROLE_LABELS: Record<ValidRole, string> = {
  admin: 'Administrador',
  tech: 'Técnico',
  recep: 'Recepcionista',
  client: 'Cliente',
  user: 'User',
};

/**
 * Validar si un string es un rol válido
 */
export function isValidRole(role: unknown): role is ValidRole {
  if (typeof role !== 'string') return false;
  return Object.values(VALID_ROLES).includes(role as ValidRole);
}

/**
 * Obtener todos los roles válidos como array
 */
export function getValidRoles(): ValidRole[] {
  return Object.values(VALID_ROLES);
}

/**
 * Obtener etiqueta legible de un rol
 */
export function getRoleLabel(role: ValidRole): string {
  return ROLE_LABELS[role] || role;
}

/**
 * Validar array de roles
 */
export function areValidRoles(roles: unknown[]): roles is ValidRole[] {
  if (!Array.isArray(roles)) return false;
  return roles.every((role) => isValidRole(role));
}

/**
 * Verificar si un usuario tiene al menos uno de los roles requeridos
 */
export function hasAnyRole(
  userRoles: ValidRole[],
  requiredRoles: ValidRole | ValidRole[],
): boolean {
  const required = Array.isArray(requiredRoles)
    ? requiredRoles
    : [requiredRoles];

  return userRoles.some((role) => required.includes(role));
}

/**
 * Verificar si un usuario tiene todos los roles requeridos
 */
export function hasAllRoles(
  userRoles: ValidRole[],
  requiredRoles: ValidRole[],
): boolean {
  return requiredRoles.every((role) => userRoles.includes(role));
}

/**
 * Normalizar rol (case-insensitive)
 * Ej: "ADMIN" → "admin", "Admin" → "admin"
 */
export function normalizeRole(role: string): ValidRole | null {
  const normalized = role.toLowerCase().trim();
  if (isValidRole(normalized)) {
    return normalized;
  }
  return null;
}

/**
 * Convertir enum legacy Role (si existe) a slug de BD
 * Para migración gradual de código viejo
 * 
 * Ej:
 * - Role.ADMIN ('Administrador') → 'admin'
 * - Role.TECH ('Técnico') → 'tech'
 */
export function legacyRoleToSlug(legacyRole: string): ValidRole | null {
  const mapping: Record<string, ValidRole> = {
    'Administrador': 'admin',
    'Técnico': 'tech',
    'Recepcionista': 'recep',
    'Cliente': 'client',
    'User': 'user',
  };

  return mapping[legacyRole] || null;
}

/**
 * Convertir slug de BD a nombre legible
 * Útil para logs, auditoría
 */
export function slugToLegacyRole(slug: ValidRole): string {
  const reverseMapping: Record<ValidRole, string> = {
    admin: 'Administrador',
    tech: 'Técnico',
    recep: 'Recepcionista',
    client: 'Cliente',
    user: 'User',
  };

  return reverseMapping[slug];
}

/**
 * Clase helper para trabajar con roles en servicios
 * Uso: new RoleHelper(userRoles).hasRole('admin')
 */
export class RoleHelper {
  constructor(private roles: ValidRole[]) {}

  has(role: ValidRole): boolean {
    return this.roles.includes(role);
  }

  hasAny(roles: ValidRole[]): boolean {
    return hasAnyRole(this.roles, roles);
  }

  hasAll(roles: ValidRole[]): boolean {
    return hasAllRoles(this.roles, roles);
  }

  isAdmin(): boolean {
    return this.has(VALID_ROLES.ADMIN);
  }

  isTech(): boolean {
    return this.has(VALID_ROLES.TECH);
  }

  isRecep(): boolean {
    return this.has(VALID_ROLES.RECEP);
  }

  isClient(): boolean {
    return this.has(VALID_ROLES.CLIENT);
  }

  isUser(): boolean {
    return this.has(VALID_ROLES.USER);
  }

  getRoles(): ValidRole[] {
    return [...this.roles];
  }

  getLabels(): string[] {
    return this.roles.map((role) => getRoleLabel(role));
  }
}
