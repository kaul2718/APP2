import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioRolService } from './usuario-rol.service';
import { UsuarioRolController } from './usuario-rol.controller';
import { UserRole } from '../user-role/entities/user-role.entity';
import { User } from '../users/entities/user.entity';
import { Rol } from '../rol/entities/rol.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserRole, User, Rol])],
  controllers: [UsuarioRolController],
  providers: [UsuarioRolService],
  exports: [UsuarioRolService],
})
export class UsuarioRolModule {}
