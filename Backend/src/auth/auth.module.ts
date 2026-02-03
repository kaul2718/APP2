import { Module, forwardRef } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { BrevoService } from './brevo.service';

@Module({
  imports: [forwardRef(() => UsersModule)],
  controllers: [AuthController],
  providers: [AuthService, BrevoService],
  exports: [BrevoService],
})
export class AuthModule {}
