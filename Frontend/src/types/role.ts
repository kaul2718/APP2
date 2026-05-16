/**
 * Slugs de roles desde BD
 * Corresponden a los slugs almacenados en la tabla 'roles'
 */
export enum Role {
    ADMIN = 'admin',
    TECH = 'tech',
    CLIENT = 'client',
    RECEP = 'recep'
}

/**
 * Mapeo para mostrar nombres legibles en la UI
 */
export const RoleDisplayNames: Record<Role, string> = {
    [Role.ADMIN]: 'Administrador',
    [Role.TECH]: 'Técnico',
    [Role.CLIENT]: 'Cliente',
    [Role.RECEP]: 'Recepcionista'
}