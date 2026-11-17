import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ClientActivityEvent } from './entities/client-activity-event.entity';
import { ClientActivityService } from './client-activity.service';
import { ClientActivityController } from './client-activity.controller';
import { GuardsModule } from '../auth/guards.module';
import { jwtConstants } from '../auth/constants/jwt.constant';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([ClientActivityEvent]),
    GuardsModule,
    JwtModule.register({
      secret: jwtConstants.secret,
    }),
  ],
  controllers: [ClientActivityController],
  providers: [ClientActivityService],
  exports: [ClientActivityService],
})
export class ClientActivityModule {}

