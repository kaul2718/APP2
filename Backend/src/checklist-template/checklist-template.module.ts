import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChecklistTemplate } from './entities/checklist-template.entity';
import { ChecklistTemplateService } from './checklist-template.service';
import { ChecklistTemplateController } from './checklist-template.controller';
import { TipoEquipo } from '../tipo-equipo/entities/tipo-equipo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChecklistTemplate, TipoEquipo])],
  controllers: [ChecklistTemplateController],
  providers: [ChecklistTemplateService],
  exports: [ChecklistTemplateService],
})
export class ChecklistTemplateModule {}
