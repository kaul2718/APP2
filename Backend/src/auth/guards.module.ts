import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from './guard/auth.guard';
import { RolesGuard } from './guard/roles.guard';
import { PermissionsGuard } from './guard/permissions.guard';
import { UsersModule } from '../users/users.module';
import { RolModule } from '../rol/rol.module';
import { jwtConstants } from './constants/jwt.constant';

/**
 * Módulo global de guards
 * Proporciona AuthGuard, RolesGuard y PermissionsGuard a toda la aplicación
 */
@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1d' },
    }),
    UsersModule,
    RolModule,
  ],
  providers: [AuthGuard, RolesGuard, PermissionsGuard],
  exports: [
    AuthGuard,
    RolesGuard,
    PermissionsGuard,
    JwtModule,
    UsersModule,
    RolModule,
  ],
})
export class GuardsModule {}
