import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChecklistTemplate } from './entities/checklist-template.entity';
import { TipoEquipo } from '../tipo-equipo/entities/tipo-equipo.entity';
import {
  CreateChecklistTemplateDto,
  UpdateChecklistTemplateDto,
} from './dto/checklist-template.dto';

@Injectable()
export class ChecklistTemplateService {
  constructor(
    @InjectRepository(ChecklistTemplate)
    private readonly checklistTemplateRepository: Repository<ChecklistTemplate>,
    @InjectRepository(TipoEquipo)
    private readonly tipoEquipoRepository: Repository<TipoEquipo>,
  ) {}

  async create(createDto: CreateChecklistTemplateDto): Promise<ChecklistTemplate> {
    // 1. Validar que el tipo de equipo existe
    const tipoEquipo = await this.tipoEquipoRepository.findOne({
      where: { id: createDto.tipoEquipoId },
    });
    if (!tipoEquipo) {
      throw new NotFoundException(
        `El tipo de equipo con ID ${createDto.tipoEquipoId} no existe`,
      );
    }
    if (!tipoEquipo.estado) {
      throw new BadRequestException(
        `El tipo de equipo "${tipoEquipo.nombre}" se encuentra inactivo`,
      );
    }

    const estado = createDto.estado !== undefined ? createDto.estado : true;

    // 2. Si se crea como activa, evitar plantillas activas duplicadas para el mismo tipo de equipo
    if (estado) {
      const activeExisting = await this.checklistTemplateRepository.findOne({
        where: { tipoEquipoId: createDto.tipoEquipoId, estado: true },
      });
      if (activeExisting) {
        throw new ConflictException(
          `Ya existe una plantilla activa ("${activeExisting.nombre}") para el tipo de equipo "${tipoEquipo.nombre}". Desactívela antes de crear otra activa.`,
        );
      }
    }

    const template = this.checklistTemplateRepository.create({
      ...createDto,
      estado,
    });
    return await this.checklistTemplateRepository.save(template);
  }

  async findAll(
    page: number = 1,
    limit: number = 100,
    includeInactive: boolean = false,
    search?: string,
  ): Promise<{
    items: ChecklistTemplate[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
  }> {
    const queryBuilder = this.checklistTemplateRepository
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.tipoEquipo', 'tipoEquipo')
      .orderBy('template.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (!includeInactive) {
      queryBuilder.andWhere('template.estado = :estado', { estado: true });
    }

    if (search && search.trim()) {
      queryBuilder.andWhere(
        '(LOWER(template.nombre) LIKE LOWER(:search) OR LOWER(tipoEquipo.nombre) LIKE LOWER(:search))',
        { search: `%${search.trim()}%` },
      );
    }

    const [items, totalItems] = await queryBuilder.getManyAndCount();

    return {
      items,
      totalItems,
      totalPages: Math.ceil(totalItems / limit) || 1,
      currentPage: page,
    };
  }

  async findByTipoEquipo(tipoEquipoId: number): Promise<ChecklistTemplate> {
    const template = await this.checklistTemplateRepository.findOne({
      where: { tipoEquipoId, estado: true },
      relations: ['tipoEquipo'],
      order: { updatedAt: 'DESC' },
    });
    if (!template) {
      throw new NotFoundException(
        `No se encontró plantilla activa para el tipo de equipo ${tipoEquipoId}`,
      );
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

  async update(
    id: number,
    updateDto: UpdateChecklistTemplateDto,
  ): Promise<ChecklistTemplate> {
    const template = await this.findOne(id);

    const targetTipoEquipoId =
      updateDto.tipoEquipoId !== undefined
        ? updateDto.tipoEquipoId
        : template.tipoEquipoId;

    const targetEstado =
      updateDto.estado !== undefined ? updateDto.estado : template.estado;

    // 1. Si cambia el tipoEquipoId, validar que exista
    if (updateDto.tipoEquipoId !== undefined) {
      const tipoEquipo = await this.tipoEquipoRepository.findOne({
        where: { id: updateDto.tipoEquipoId },
      });
      if (!tipoEquipo) {
        throw new NotFoundException(
          `El tipo de equipo con ID ${updateDto.tipoEquipoId} no existe`,
        );
      }
      if (!tipoEquipo.estado) {
        throw new BadRequestException(
          `El tipo de equipo "${tipoEquipo.nombre}" se encuentra inactivo`,
        );
      }
    }

    // 2. Si la plantilla quedará activa, evitar conflicto con otra plantilla activa del mismo tipo de equipo
    if (targetEstado) {
      const activeExisting = await this.checklistTemplateRepository.findOne({
        where: { tipoEquipoId: targetTipoEquipoId, estado: true },
      });
      if (activeExisting && activeExisting.id !== id) {
        const te = await this.tipoEquipoRepository.findOne({
          where: { id: targetTipoEquipoId },
        });
        const nombreEquipo = te ? te.nombre : `ID ${targetTipoEquipoId}`;
        throw new ConflictException(
          `Ya existe otra plantilla activa ("${activeExisting.nombre}") para el tipo de equipo "${nombreEquipo}". Desactívela antes de activar esta.`,
        );
      }
    }

    const updatedTemplate = Object.assign(template, updateDto);
    return await this.checklistTemplateRepository.save(updatedTemplate);
  }

  async remove(id: number): Promise<void> {
    const template = await this.findOne(id);
    await this.checklistTemplateRepository.softRemove(template);
  }
}
