import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../organizations/guards/roles.guard';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

describe('TasksController', () => {
  let controller: TasksController;
  let service: TasksService;

  const mockTasksService = {
    create: jest.fn(),
    findAllByProject: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as any;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        { provide: TasksService, useValue: mockTasksService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<TasksController>(TasksController);
    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create', async () => {
      const dto = { title: 'New Task' };
      mockTasksService.create.mockResolvedValue({ id: 'task-1', ...dto });

      const result = await controller.create('proj-1', dto as any);

      expect(service.create).toHaveBeenCalledWith('proj-1', dto);
      expect(result.id).toEqual('task-1');
    });
  });

  describe('findAll', () => {
    it('should call service.findAllByProject', async () => {
      await controller.findAll('proj-1');
      expect(service.findAllByProject).toHaveBeenCalledWith('proj-1');
    });
  });

  describe('update', () => {
    it('should call service.update', async () => {
      const dto = { status: 'DONE' as any };
      await controller.update('task-1', dto as any);
      expect(service.update).toHaveBeenCalledWith('task-1', dto);
    });
  });

  describe('remove', () => {
    it('should call service.remove', async () => {
      await controller.remove('task-1');
      expect(service.remove).toHaveBeenCalledWith('task-1');
    });
  });
});