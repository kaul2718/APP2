import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import { Rol } from '../rol/entities/rol.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { RolePermission } from '../role-permission/entities/role-permission.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../user-role/entities/user-role.entity';
import { EstadoOrden } from '../estado-orden/entities/estado-orden.entity';
import { EstadoPresupuesto } from '../estado-presupuesto/entities/estado-presupuesto.entity';
import { TipoActividadTecnica } from '../tipo-actividad-tecnica/entities/tipo-actividad-tecnica.entity';
import { TipoNotificacion } from '../tipo-notificacion/entities/tipo-notificacion.entity';
import { TipoEquipo } from '../tipo-equipo/entities/tipo-equipo.entity';
import { ConfiguracionSistema } from '../configuracion-sistema/entities/configuracion-sistema.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Rol,
      Permission,
      RolePermission,
      User,
      UserRole,
      EstadoOrden,
      EstadoPresupuesto,
      TipoActividadTecnica,
      TipoNotificacion,
      TipoEquipo,
      ConfiguracionSistema,
    ]),
  ],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
