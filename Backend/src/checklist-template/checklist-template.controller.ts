import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { ChecklistTemplateService } from './checklist-template.service';
import { CreateChecklistTemplateDto, UpdateChecklistTemplateDto } from './dto/checklist-template.dto';
import { Auth } from '../auth/decorators/auth.decorator';

@Controller('checklist-template')
export class ChecklistTemplateController {
  constructor(private readonly checklistTemplateService: ChecklistTemplateService) {}

  @Auth('admin')
  @Post()
  create(@Body() createDto: CreateChecklistTemplateDto) {
    return this.checklistTemplateService.create(createDto);
  }

  @Get('all')
  findAllAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.checklistTemplateService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 100
    );
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.checklistTemplateService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 100
    );
  }

  @Get('tipo-equipo/:id')
  findByTipoEquipo(@Param('id', ParseIntPipe) tipoEquipoId: number) {
    return this.checklistTemplateService.findByTipoEquipo(tipoEquipoId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.checklistTemplateService.findOne(id);
  }

  @Auth('admin')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateChecklistTemplateDto) {
    return this.checklistTemplateService.update(id, updateDto);
  }

  @Auth('admin')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.checklistTemplateService.remove(id);
    return { success: true };
  }
}
