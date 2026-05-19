import { Module } from '@nestjs/common';
import { SriService } from './sri.service';
import { SriController } from './sri.controller';

@Module({
  controllers: [SriController],
  providers: [SriService],
  exports: [SriService],
})
export class SriModule {}
