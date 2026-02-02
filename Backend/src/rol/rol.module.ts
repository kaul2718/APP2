import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolService } from './rol.service';
import { RolController } from './rol.controller';
import { Rol } from './entities/rol.entity';
import { RolePermission } from '../role-permission/entities/role-permission.entity';
import { UserRole } from '../user-role/entities/user-role.entity';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Rol, RolePermission, UserRole]),
    PermissionsModule,
  ],
  controllers: [RolController],
  providers: [RolService],
  exports: [RolService],
})
export class RolModule {}
