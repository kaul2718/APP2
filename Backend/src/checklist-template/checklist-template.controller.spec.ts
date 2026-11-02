import { Test, TestingModule } from '@nestjs/testing';
import { ChecklistTemplateController } from './checklist-template.controller';
import { ChecklistTemplateService } from './checklist-template.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RolService } from '../rol/rol.service';

describe('ChecklistTemplateController', () => {
  let controller: ChecklistTemplateController;

  const mockChecklistService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockUsersService = {
    findOne: jest.fn(),
  };

  const mockRolService = {
    findAll: jest.fn(),
    findBySlug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChecklistTemplateController],
      providers: [
        {
          provide: ChecklistTemplateService,
          useValue: mockChecklistService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: RolService,
          useValue: mockRolService,
        },
      ],
    }).compile();

    controller = module.get<ChecklistTemplateController>(ChecklistTemplateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
