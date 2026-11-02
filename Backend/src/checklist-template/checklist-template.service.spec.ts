import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChecklistTemplateService } from './checklist-template.service';
import { ChecklistTemplate } from './entities/checklist-template.entity';

describe('ChecklistTemplateService', () => {
  let service: ChecklistTemplateService;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softRemove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChecklistTemplateService,
        {
          provide: getRepositoryToken(ChecklistTemplate),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ChecklistTemplateService>(ChecklistTemplateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
