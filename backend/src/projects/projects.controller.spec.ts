import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../organizations/guards/roles.guard';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: ProjectsService;

  // Mockeamos el servicio de proyectos
  const mockProjectsService = {
    create: jest.fn(),
    findAllByOrg: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as any;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        { provide: ProjectsService, useValue: mockProjectsService },
      ],
    })
      //  IGNORAMOS LA SEGURIDAD EN ESTA PRUEBA UNITARIA
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<ProjectsController>(ProjectsController);
    service = module.get<ProjectsService>(ProjectsService);
  });

  describe('create', () => {
    it('should call service.create', async () => {
      const dto = { name: 'New Project' };
      mockProjectsService.create.mockResolvedValue({ id: 'proj-1', ...dto });

      const result = await controller.create('org-1', dto as any);

      expect(service.create).toHaveBeenCalledWith('org-1', dto);
      expect(result.id).toEqual('proj-1');
    });
  });

  describe('findAll', () => {
    it('should call service.findAllByOrg', async () => {
      await controller.findAll('org-1');
      expect(service.findAllByOrg).toHaveBeenCalledWith('org-1');
    });
  });

  describe('findOne', () => {
    it('should call service.findOne', async () => {
      await controller.findOne('org-1', 'proj-1');
      expect(service.findOne).toHaveBeenCalledWith('org-1', 'proj-1');
    });
  });

  describe('update', () => {
    it('should call service.update', async () => {
      const dto = { name: 'Updated' };
      await controller.update('org-1', 'proj-1', dto as any);
      expect(service.update).toHaveBeenCalledWith('org-1', 'proj-1', dto);
    });
  });

  describe('remove', () => {
    it('should call service.remove', async () => {
      await controller.remove('org-1', 'proj-1');
      expect(service.remove).toHaveBeenCalledWith('org-1', 'proj-1');
    });
  });
});