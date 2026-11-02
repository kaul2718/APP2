import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { PERMISSIONS_KEY } from '../../decorators/permissions.decorator';
import { VALID_ROLES } from '../../common/helpers/role.helper';
import { RolService } from '../../rol/rol.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rolService: RolService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      return false;
    }

    // Los admins siempre tienen permisos
    const isAdmin =
      (user as any).role === VALID_ROLES.ADMIN ||
      (user.userRoles && user.userRoles.some((ur) => ur.rol?.slug === VALID_ROLES.ADMIN));

    if (isAdmin) {
      return true;
    }

    // Obtener permisos del usuario a través de sus roles
    if (user.userRoles && user.userRoles.length > 0) {
      for (const userRole of user.userRoles) {
        if (userRole.rol?.rolePermissions) {
          const userPermissions = userRole.rol.rolePermissions
            .map((rp) => rp.permission?.slug)
            .filter(Boolean);

          // Verificar si tiene al menos uno de los permisos requeridos
          const hasPermission = requiredPermissions.some((permission) =>
            userPermissions.includes(permission),
          );

          if (hasPermission) {
            return true;
          }
        }
      }
    }

    return false;
  }
}
