import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../decorators/roles.decorator';
import { ValidRole, VALID_ROLES, resolveUserAuthContext } from '../../common/helpers/role.helper';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<ValidRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no hay roles especificados, permite el acceso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      return false;
    }

    const { roles: userRoles } = resolveUserAuthContext(user);
    if (userRoles.length === 0) {
      return false;
    }

    // Si el usuario es admin activo, tiene acceso administrativo
    if (userRoles.includes(VALID_ROLES.ADMIN)) {
      return true;
    }

    // Verificar si el usuario tiene al menos uno de los roles requeridos
    return userRoles.some((role) => requiredRoles.includes(role as ValidRole));
  }
}


