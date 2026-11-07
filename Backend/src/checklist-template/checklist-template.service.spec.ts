import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChecklistTemplateService } from './checklist-template.service';
import { ChecklistTemplate } from './entities/checklist-template.entity';
import { TipoEquipo } from '../tipo-equipo/entities/tipo-equipo.entity';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('ChecklistTemplateService', () => {
  let service: ChecklistTemplateService;

  const mockChecklistRepo: any = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softRemove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockTipoEquipoRepo: any = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChecklistTemplateService,
        {
          provide: getRepositoryToken(ChecklistTemplate),
          useValue: mockChecklistRepo,
        },
        {
          provide: getRepositoryToken(TipoEquipo),
          useValue: mockTipoEquipoRepo,
        },
      ],
    }).compile();

    service = module.get<ChecklistTemplateService>(ChecklistTemplateService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe lanzar NotFoundException si el tipo de equipo no existe', async () => {
      mockTipoEquipoRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          nombre: 'Plantilla Test',
          tipoEquipoId: 999,
          items: ['Item 1'],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar BadRequestException si el tipo de equipo está inactivo', async () => {
      mockTipoEquipoRepo.findOne.mockResolvedValue({ id: 1, nombre: 'Laptop', estado: false });

      await expect(
        service.create({
          nombre: 'Plantilla Test',
          tipoEquipoId: 1,
          items: ['Item 1'],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar ConflictException si ya existe una plantilla activa para el mismo tipo de equipo', async () => {
      mockTipoEquipoRepo.findOne.mockResolvedValue({ id: 1, nombre: 'Laptop', estado: true });
      mockChecklistRepo.findOne.mockResolvedValue({ id: 5, nombre: 'Existente', tipoEquipoId: 1, estado: true });

      await expect(
        service.create({
          nombre: 'Nueva Laptop',
          tipoEquipoId: 1,
          items: { fisica: ['Carcasa'], funcional: ['Encendido'] },
          estado: true,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('debe crear exitosamente con formato dual { fisica, funcional }', async () => {
      const tipoEquipo = { id: 1, nombre: 'Laptop', estado: true };
      mockTipoEquipoRepo.findOne.mockResolvedValue(tipoEquipo);
      mockChecklistRepo.findOne.mockResolvedValue(null); // No hay activa
      const createdEntity = {
        id: 10,
        nombre: 'Laptop Completa',
        tipoEquipoId: 1,
        items: { fisica: ['Carcasa'], funcional: ['Encendido'] },
        estado: true,
      };
      mockChecklistRepo.create.mockReturnValue(createdEntity);
      mockChecklistRepo.save.mockResolvedValue(createdEntity);

      const result = await service.create({
        nombre: 'Laptop Completa',
        tipoEquipoId: 1,
        items: { fisica: ['Carcasa'], funcional: ['Encendido'] },
      });

      expect(result).toEqual(createdEntity);
      expect(mockChecklistRepo.save).toHaveBeenCalled();
    });

    it('debe permitir crear plantilla inactiva aunque ya exista una activa', async () => {
      const tipoEquipo = { id: 1, nombre: 'Laptop', estado: true };
      mockTipoEquipoRepo.findOne.mockResolvedValue(tipoEquipo);
      const createdEntity = {
        id: 11,
        nombre: 'Laptop Borrador',
        tipoEquipoId: 1,
        items: ['Item 1'],
        estado: false,
      };
      mockChecklistRepo.create.mockReturnValue(createdEntity);
      mockChecklistRepo.save.mockResolvedValue(createdEntity);

      const result = await service.create({
        nombre: 'Laptop Borrador',
        tipoEquipoId: 1,
        items: ['Item 1'],
        estado: false,
      });

      expect(result.estado).toBe(false);
      expect(mockChecklistRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('debe impedir reactivar una plantilla si ya existe otra activa para el mismo tipo de equipo (ConflictException)', async () => {
      const templateAEditar = {
        id: 2,
        nombre: 'Laptop Alternativa',
        tipoEquipoId: 1,
        estado: false,
      };
      // findOne para cargar el template actual
      mockChecklistRepo.findOne.mockResolvedValueOnce(templateAEditar);
      // findOne para verificar conflicto con otra activa
      mockChecklistRepo.findOne.mockResolvedValueOnce({
        id: 1,
        nombre: 'Laptop Principal',
        tipoEquipoId: 1,
        estado: true,
      });
      mockTipoEquipoRepo.findOne.mockResolvedValue({ id: 1, nombre: 'Laptop', estado: true });

      await expect(
        service.update(2, {
          estado: true,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('debe permitir desactivar una plantilla activa (estado: false)', async () => {
      const templateActivo = {
        id: 1,
        nombre: 'Laptop Principal',
        tipoEquipoId: 1,
        estado: true,
      };
      mockChecklistRepo.findOne.mockResolvedValueOnce(templateActivo);
      const updated = { ...templateActivo, estado: false };
      mockChecklistRepo.save.mockResolvedValue(updated);

      const result = await service.update(1, { estado: false });
      expect(result.estado).toBe(false);
      expect(mockChecklistRepo.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('debe respetar includeInactive = false y filtrar por estado = true', async () => {
      const mockQb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[{ id: 1, nombre: 'P1', estado: true }], 1]),
      };
      mockChecklistRepo.createQueryBuilder.mockReturnValue(mockQb);

      const res = await service.findAll(1, 10, false);

      expect(mockQb.andWhere).toHaveBeenCalledWith('template.estado = :estado', { estado: true });
      expect(res.items.length).toBe(1);
    });

    it('debe respetar includeInactive = true y no filtrar por estado = true', async () => {
      const mockQb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          [{ id: 1, estado: true }, { id: 2, estado: false }],
          2,
        ]),
      };
      mockChecklistRepo.createQueryBuilder.mockReturnValue(mockQb);

      const res = await service.findAll(1, 10, true);

      expect(mockQb.andWhere).not.toHaveBeenCalledWith('template.estado = :estado', { estado: true });
      expect(res.totalItems).toBe(2);
    });
  });

  describe('findByTipoEquipo', () => {
    it('debe retornar exclusivamente la plantilla activa para el tipo de equipo', async () => {
      const template = { id: 1, tipoEquipoId: 1, estado: true };
      mockChecklistRepo.findOne.mockResolvedValue(template);

      const result = await service.findByTipoEquipo(1);
      expect(result).toBe(template);
      expect(mockChecklistRepo.findOne).toHaveBeenCalledWith({
        where: { tipoEquipoId: 1, estado: true },
        relations: ['tipoEquipo'],
        order: { updatedAt: 'DESC' },
      });
    });

    it('NUNCA debe retornar una plantilla inactiva para una nueva orden y debe lanzar NotFoundException', async () => {
      // Cuando solo hay plantillas inactivas, la consulta con estado: true retorna null
      mockChecklistRepo.findOne.mockResolvedValue(null);

      await expect(service.findByTipoEquipo(1)).rejects.toThrow(NotFoundException);
      expect(mockChecklistRepo.findOne).toHaveBeenCalledWith({
        where: { tipoEquipoId: 1, estado: true },
        relations: ['tipoEquipo'],
        order: { updatedAt: 'DESC' },
      });
    });
  });
});
