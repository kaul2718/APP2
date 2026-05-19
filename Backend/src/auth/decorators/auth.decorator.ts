import { applyDecorators, UseGuards } from '@nestjs/common';
import { ValidRole } from '../../common/helpers/role.helper';
import { AuthGuard } from '../guard/auth.guard';
import { RolesGuard } from '../guard/roles.guard';
import { PermissionsGuard } from '../guard/permissions.guard';
import { Roles } from '../../decorators/roles.decorator';

/**
 * Decorador compuesto para autenticación + autorización por roles y permisos dinámicos
 * Uso: @Auth('admin', 'tech')
 */
export function Auth(...roles: ValidRole[]) {
  return applyDecorators(
    Roles(...roles),
    UseGuards(AuthGuard, RolesGuard, PermissionsGuard),
  );
}