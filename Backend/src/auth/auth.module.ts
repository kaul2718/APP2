import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ActivacionService } from './activacion.service';
import { UsersModule } from '../users/users.module';
import { BrevoService } from './brevo.service';
import { ActivacionCuenta } from './entities/activacion-cuenta.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ActivacionCuenta, User]),
    forwardRef(() => UsersModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, ActivacionService, BrevoService],
  exports: [AuthService, ActivacionService, BrevoService],
})
export class AuthModule {}
