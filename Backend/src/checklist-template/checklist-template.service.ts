import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChecklistTemplate } from './entities/checklist-template.entity';
import { CreateChecklistTemplateDto, UpdateChecklistTemplateDto } from './dto/checklist-template.dto';

@Injectable()
export class ChecklistTemplateService {
  constructor(
    @InjectRepository(ChecklistTemplate)
    private readonly checklistTemplateRepository: Repository<ChecklistTemplate>,
  ) {}

  async create(createDto: CreateChecklistTemplateDto): Promise<ChecklistTemplate> {
    const template = this.checklistTemplateRepository.create(createDto);
    return await this.checklistTemplateRepository.save(template);
  }

  async findAll(page: number = 1, limit: number = 100): Promise<{ items: ChecklistTemplate[], totalItems: number, totalPages: number, currentPage: number }> {
    const [items, totalItems] = await this.checklistTemplateRepository.findAndCount({
      relations: ['tipoEquipo'],
      where: { estado: true },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' }
    });

    return {
      items,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page
    };
  }

  async findByTipoEquipo(tipoEquipoId: number): Promise<ChecklistTemplate> {
    const template = await this.checklistTemplateRepository.findOne({
      where: { tipoEquipoId, estado: true },
      relations: ['tipoEquipo'],
    });
    if (!template) {
      throw new NotFoundException(`No se encontró plantilla para el tipo de equipo ${tipoEquipoId}`);
    }
    return template;
  }

  async findOne(id: number): Promise<ChecklistTemplate> {
    const template = await this.checklistTemplateRepository.findOne({
      where: { id },
      relations: ['tipoEquipo'],
    });
    if (!template) {
      throw new NotFoundException(`Plantilla con ID ${id} no encontrada`);
    }
    return template;
  }

  async update(id: number, updateDto: UpdateChecklistTemplateDto): Promise<ChecklistTemplate> {
    const template = await this.findOne(id);
    const updatedTemplate = Object.assign(template, updateDto);
    return await this.checklistTemplateRepository.save(updatedTemplate);
  }

  async remove(id: number): Promise<void> {
    const template = await this.findOne(id);
    await this.checklistTemplateRepository.softRemove(template);
  }
}
