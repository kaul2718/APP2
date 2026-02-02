import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../decorators/roles.decorator';
import { ValidRole, VALID_ROLES, RoleHelper } from '../../common/helpers/role.helper';

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

    // Los roles del usuario vienen de la BD via UserRole
    const userRoles: ValidRole[] = (user.userRoles || []).map(
      (ur: any) => ur.rol?.slug,
    );

    // Si el usuario es admin, tiene acceso a todo
    if (userRoles.includes(VALID_ROLES.ADMIN)) {
      return true;
    }

    // Verificar si el usuario tiene al menos uno de los roles requeridos
    return userRoles.some((role) => requiredRoles.includes(role));
  }
}


