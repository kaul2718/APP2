import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { ActividadTecnicaModule } from './actividad-tecnica/actividad-tecnica.module';
import { PresupuestoModule } from './presupuesto/presupuesto.module';
import { CasilleroModule } from './casillero/casillero.module';
import { RepuestosModule } from './repuestos/repuestos.module';
import { DetalleRepuestosModule } from './detalle-repuestos/detalle-repuestos.module';
import { EquipoModule } from './equipo/equipo.module';
import { ServiciosModule } from './servicios/servicios.module';
import { DetalleServiciosModule } from './detalle-servicios/detalle-servicios.module';
import { ConfigModule } from '@nestjs/config';
import { rejects } from 'assert';

@Module({
  imports: [
    
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      synchronize: true,
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
    RepuestosModule,
    DetalleRepuestosModule,
    EquipoModule,
    ServiciosModule,
    DetalleServiciosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

// El módulo es quien dice qué controllers y servicios trabajan juntos.
// Es como armar un grupo de panas con una misión específica, como manejar los clientes o los pedidos.

