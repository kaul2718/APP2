import { SetMetadata } from '@nestjs/common';
import { ValidRole } from '../common/helpers/role.helper';

export const ROLES_KEY = 'roles';

/**
 * Decorador para restricción de roles
 * Uso: @Roles('admin', 'tech')
 */
export const Roles = (...roles: ValidRole[]) =>
  SetMetadata(ROLES_KEY, roles);
