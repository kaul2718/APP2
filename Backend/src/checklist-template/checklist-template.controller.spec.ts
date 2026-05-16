import { Test, TestingModule } from '@nestjs/testing';
import { ChecklistTemplateController } from './checklist-template.controller';

describe('ChecklistTemplateController', () => {
  let controller: ChecklistTemplateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChecklistTemplateController],
    }).compile();

    controller = module.get<ChecklistTemplateController>(ChecklistTemplateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
