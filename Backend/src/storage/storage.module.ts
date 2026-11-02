import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from './storage.service';
import { ImageOptimizerService } from './image-optimizer.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [StorageService, ImageOptimizerService],
  exports: [StorageService, ImageOptimizerService],
})
export class StorageModule {}
