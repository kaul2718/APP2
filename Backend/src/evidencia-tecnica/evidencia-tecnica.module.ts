import { Module } from '@nestjs/common';
import { EvidenciaTecnicaService } from './evidencia-tecnica.service';
import { EvidenciaTecnicaController } from './evidencia-tecnica.controller';

@Module({
  controllers: [EvidenciaTecnicaController],
  providers: [EvidenciaTecnicaService],
})
export class EvidenciaTecnicaModule {}
