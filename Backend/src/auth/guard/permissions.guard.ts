import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../../decorators/permissions.decorator';
import { VALID_ROLES, resolveUserAuthContext } from '../../common/helpers/role.helper';
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

    const authContext = resolveUserAuthContext(user);
    if (authContext.roles.length === 0) {
      return false;
    }

    // Los admins activos siempre tienen permisos administrativos
    if (authContext.roles.includes(VALID_ROLES.ADMIN)) {
      return true;
    }

    // Verificar unión de permisos efectivos de todos los roles activos
    return requiredPermissions.some((permission) =>
      authContext.permissions.includes(permission),
    );
  }
}
