import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { GuardsModule } from './auth/guards.module';
import { OrdersModule } from './orders/orders.module';
import { ActividadTecnicaModule } from './actividad-tecnica/actividad-tecnica.module';
import { PresupuestoModule } from './presupuesto/presupuesto.module';
import { CasilleroModule } from './casillero/casillero.module';
import { DetallePresupuestoItemModule } from './detalle-presupuesto-item/detalle-presupuesto-item.module';
import { EquipoModule } from './equipo/equipo.module';
import { ConfigModule } from '@nestjs/config';
import { RolModule } from './rol/rol.module';
import { UsuarioRolModule } from './usuario-rol/usuario-rol.module';
import { EstadoOrdenModule } from './estado-orden/estado-orden.module';
import { HistorialEstadoOrdenModule } from './historial-estado-orden/historial-estado-orden.module';
import { TipoEquipoModule } from './tipo-equipo/tipo-equipo.module';
import { MarcaModule } from './marca/marca.module';
import { ModeloModule } from './modelo/modelo.module';
import { TipoActividadTecnicaModule } from './tipo-actividad-tecnica/tipo-actividad-tecnica.module';
import { EvidenciaTecnicaModule } from './evidencia-tecnica/evidencia-tecnica.module';
import { EstadoPresupuestoModule } from './estado-presupuesto/estado-presupuesto.module';
import { DetalleManoObraModule } from './detalle-mano-obra/detalle-mano-obra.module';
import { TipoManoObraModule } from './tipo-mano-obra/tipo-mano-obra.module';
import { ParteModule } from './parte/parte.module';
import { CategoriaModule } from './categoria/categoria.module';
import { InventarioModule } from './inventario/inventario.module';
import { NotificacionModule } from './notificacion/notificacion.module';
import { TipoNotificacionModule } from './tipo-notificacion/tipo-notificacion.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolePermissionModule } from './role-permission/role-permission.module';
import { SeederModule } from './seeder/seeder.module';

@Module({
  imports: [
    
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    GuardsModule,

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      synchronize: false,
      ssl: process.env.DB_SSL === 'true',
      extra: {
        ssl:
        process.env.DB_SSL === 'true'
        ? {
          rejectUnauthorized: false,
        }
        :null,
      },
    }),
    AuthModule,
    OrdersModule,
    ActividadTecnicaModule,
    PresupuestoModule,
    CasilleroModule,
    DetallePresupuestoItemModule,
    EquipoModule,
    RolModule,
    UsuarioRolModule,
    EstadoOrdenModule,
    HistorialEstadoOrdenModule,
    TipoEquipoModule,
    MarcaModule,
    ModeloModule,
    TipoActividadTecnicaModule,
    EvidenciaTecnicaModule,
    EstadoPresupuestoModule,
    DetalleManoObraModule,
    TipoManoObraModule,
    ParteModule,
    CategoriaModule,
    InventarioModule,
    NotificacionModule,
    TipoNotificacionModule,
    PermissionsModule,
    RolePermissionModule,
    SeederModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

// El módulo es quien dice qué controllers y servicios trabajan juntos.
// Es como armar un grupo de panas con una misión específica, como manejar los clientes o los pedidos.

