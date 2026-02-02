import { applyDecorators, UseGuards } from '@nestjs/common';
import { ValidRole } from '../../common/helpers/role.helper';
import { AuthGuard } from '../guard/auth.guard';
import { RolesGuard } from '../guard/roles.guard';
import { Roles } from '../../decorators/roles.decorator';

/**
 * Decorador compuesto para autenticación + autorización por roles
 * Uso: @Auth('admin', 'tech')
 */
export function Auth(...roles: ValidRole[]) {
  return applyDecorators(
    Roles(...roles),
    UseGuards(AuthGuard, RolesGuard),
  );
}