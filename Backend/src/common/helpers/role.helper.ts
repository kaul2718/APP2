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

export const ROLE_PRIORITY: ValidRole[] = [
  VALID_ROLES.ADMIN,
  VALID_ROLES.TECH,
  VALID_ROLES.RECEP,
  VALID_ROLES.CLIENT,
  VALID_ROLES.USER,
];

export interface UserAuthContext {
  roles: string[];
  role: string;
  permissions: string[];
  habilitadoTecnico: boolean;
}

/**
 * Resuelve de forma centralizada el contexto de autorización de un usuario
 * combinando todos sus roles activos y la unión sin duplicados de sus permisos.
 * El campo `role` se mantiene únicamente por compatibilidad con componentes heredados.
 */
export function resolveUserAuthContext(user: any): UserAuthContext {
  if (!user) {
    return {
      roles: [],
      role: 'client',
      permissions: [],
      habilitadoTecnico: false,
    };
  }

  const activeUserRoles = Array.isArray(user.userRoles)
    ? user.userRoles.filter(
        (ur: any) =>
          ur?.rol &&
          ur.rol.slug &&
          ur.rol.activo !== false &&
          !ur.rol.deletedAt,
      )
    : [];

  let roles: string[] = Array.from(
    new Set(activeUserRoles.map((ur: any) => String(ur.rol.slug).trim())),
  );

  // Fallback solo si no existe relación userRoles cargada pero sí user.role (mocks / legacy)
  if (roles.length === 0 && !Array.isArray(user.userRoles) && user.role) {
    roles = [String(user.role).trim()];
  }

  // Ordenar por prioridad únicamente para determinar el rol principal de compatibilidad
  const sortedRoles = [...roles].sort((a, b) => {
    const idxA = ROLE_PRIORITY.indexOf(a as ValidRole);
    const idxB = ROLE_PRIORITY.indexOf(b as ValidRole);
    const rankA = idxA === -1 ? 999 : idxA;
    const rankB = idxB === -1 ? 999 : idxB;
    return rankA - rankB;
  });

  const permissionsSet = new Set<string>();
  for (const ur of activeUserRoles) {
    if (Array.isArray(ur.rol?.rolePermissions)) {
      for (const rp of ur.rol.rolePermissions) {
        if (rp?.permission?.slug) {
          permissionsSet.add(String(rp.permission.slug));
        }
      }
    }
  }

  return {
    roles: sortedRoles,
    role: sortedRoles[0] || 'client',
    permissions: Array.from(permissionsSet),
    habilitadoTecnico: Boolean(user.habilitadoTecnico),
  };
}

export function userHasRole(user: any, roleSlug: string): boolean {
  return resolveUserAuthContext(user).roles.includes(roleSlug);
}

export function userHasAnyRole(user: any, roleSlugs: string[]): boolean {
  const userRoles = resolveUserAuthContext(user).roles;
  return roleSlugs.some((slug) => userRoles.includes(slug));
}

export function isOperationalStaff(user: any): boolean {
  return userHasAnyRole(user, [
    VALID_ROLES.ADMIN,
    VALID_ROLES.TECH,
    VALID_ROLES.RECEP,
  ]);
}
