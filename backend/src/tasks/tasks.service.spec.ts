import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { AnalyticsService } from '../analytics/analytics.service';
import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

describe('TasksService', () => {
  let service: TasksService;

  const mockTaskRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  } as any;

  const mockAnalyticsService = {
    logEvent: jest.fn(),
  } as any;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: mockTaskRepo },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ================= CREATE =================
  describe('create', () => {
    it('should create a task WITH an assignee', async () => {
      const dto = { title: 'Task 1', assigneeId: 'user-1' };
      const expectedCreateArg = {
        title: 'Task 1',
        project: { id: 'proj-1' },
        assignee: { id: 'user-1' },
      };

      mockTaskRepo.create.mockReturnValue(expectedCreateArg);
      mockTaskRepo.save.mockResolvedValue({ id: 'task-1', ...expectedCreateArg });

      const result = await service.create('proj-1', dto as any);

      expect(mockTaskRepo.create).toHaveBeenCalledWith(expectedCreateArg);
      expect(mockTaskRepo.save).toHaveBeenCalled();
      expect(result.id).toEqual('task-1');
    });

    it('should create a task WITHOUT an assignee', async () => {
      const dto = { title: 'Task 2' }; // Sin assigneeId
      const expectedCreateArg = {
        title: 'Task 2',
        project: { id: 'proj-1' },
        assignee: undefined,
      };

      mockTaskRepo.create.mockReturnValue(expectedCreateArg);
      mockTaskRepo.save.mockResolvedValue({ id: 'task-2', ...expectedCreateArg });

      await service.create('proj-1', dto as any);

      expect(mockTaskRepo.create).toHaveBeenCalledWith(expectedCreateArg);
    });
  });

  // ================= FIND ALL =================
  describe('findAllByProject', () => {
    it('should return tasks for a project ordered by position', async () => {
      mockTaskRepo.find.mockResolvedValue([{ id: 'task-1' }]);

      const result = await service.findAllByProject('proj-1');

      expect(mockTaskRepo.find).toHaveBeenCalledWith({
        where: { project: { id: 'proj-1' } },
        relations: ['assignee'],
        order: { position: 'ASC', createdAt: 'DESC' },
      });
      expect(result).toEqual([{ id: 'task-1' }]);
    });
  });

  // ================= UPDATE =================
  describe('update', () => {
    it('should throw NotFoundException if initial task is not found', async () => {
      mockTaskRepo.findOne.mockResolvedValue(null);
      await expect(service.update('invalid-id', {})).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if task disappears before second findOne', async () => {
      mockTaskRepo.findOne
        .mockResolvedValueOnce({ id: 'task-1', status: 'TODO' }) // Primera búsqueda (ok)
        .mockResolvedValueOnce(null); // Segunda búsqueda (desaparece)

      await expect(service.update('task-1', { title: 'New' })).rejects.toThrow(NotFoundException);
    });

    it('should update task without triggering analytics if status does not change', async () => {
      const existingTask = { id: 'task-1', status: 'TODO' };
      const updatedTask = { id: 'task-1', status: 'TODO', title: 'New Title' };

      mockTaskRepo.findOne
        .mockResolvedValueOnce(existingTask)
        .mockResolvedValueOnce(updatedTask);

      const result = await service.update('task-1', { title: 'New Title' });

      expect(mockTaskRepo.save).toHaveBeenCalled();
      expect(mockAnalyticsService.logEvent).not.toHaveBeenCalled();
      expect(result).toEqual(updatedTask);
    });

    it('should trigger TASK_COMPLETED analytics event when moving to DONE', async () => {
      const existingTask = { id: 'task-1', status: 'IN_PROGRESS' };
      const updatedTask = { 
        id: 'task-1', 
        status: 'DONE', 
        title: 'Finished',
        createdAt: new Date(),
        assignee: { id: 'user-1' },
        project: { id: 'proj-1', organization: { id: 'org-1' } }
      };

      mockTaskRepo.findOne
        .mockResolvedValueOnce(existingTask)
        .mockResolvedValueOnce(updatedTask);

      await service.update('task-1', { status: 'DONE' } as any);

      expect(mockAnalyticsService.logEvent).toHaveBeenCalledWith(expect.objectContaining({
        orgId: 'org-1',
        projectId: 'proj-1',
        userId: 'user-1',
        action: 'TASK_COMPLETED',
      }));
    });

    it('should trigger TASK_MOVED analytics event when changing to IN_PROGRESS', async () => {
      const existingTask = { id: 'task-1', status: 'TODO' };
      const updatedTask = { 
        id: 'task-1', 
        status: 'IN_PROGRESS',
        createdAt: new Date(),
        project: { id: 'proj-1', organization: { id: 'org-1' } }
      }; // Sin assignee

      mockTaskRepo.findOne
        .mockResolvedValueOnce(existingTask)
        .mockResolvedValueOnce(updatedTask);

      await service.update('task-1', { status: 'IN_PROGRESS' } as any);

      expect(mockAnalyticsService.logEvent).toHaveBeenCalledWith(expect.objectContaining({
        action: 'TASK_MOVED',
      }));
    });

    it('should handle assigneeId nullification', async () => {
      const existingTask = { id: 'task-1', status: 'TODO' };
      mockTaskRepo.findOne
        .mockResolvedValueOnce(existingTask)
        .mockResolvedValueOnce(existingTask);

      // Enviamos assigneeId nulo para desasignar la tarea
      await service.update('task-1', { assigneeId: null } as any);

      // Verificamos que se guardó la tarea modificada con assignee = null
      expect(mockTaskRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        assignee: null
      }));
    });
  });

  // ================= REMOVE =================
  describe('remove', () => {
    it('should throw NotFoundException if task not found', async () => {
      mockTaskRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('should remove task successfully', async () => {
      const task = { id: 'task-1' };
      mockTaskRepo.findOne.mockResolvedValue(task);
      mockTaskRepo.remove.mockResolvedValue(task);

      const result = await service.remove('task-1');

      expect(mockTaskRepo.remove).toHaveBeenCalledWith(task);
      expect(result).toEqual({ message: 'Task deleted' });
    });
  });
});