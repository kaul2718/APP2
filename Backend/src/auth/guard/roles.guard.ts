import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { Role } from '../../common/enums/rol.enum';
import { ROLES_KEY } from '../../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles) {
      return true; // Si no hay roles especificados, permite el acceso
    }

    const { user } = context.switchToHttp().getRequest();
    //console.log(user.role); // Verifica el rol del usuario

    if (user.role === Role.ADMIN) {
      return true; // Si el usuario es admin, tiene acceso
    }

    // Verifica si el rol del usuario está dentro de los roles permitidos
    return roles.includes(user.role);
  }
}


