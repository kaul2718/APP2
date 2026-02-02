import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import { Rol } from '../rol/entities/rol.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { RolePermission } from '../role-permission/entities/role-permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Rol, Permission, RolePermission])],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
