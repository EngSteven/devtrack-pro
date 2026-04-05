import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

describe('ProjectsService', () => {
  let service: ProjectsService;

  // 1. Mockeamos el QueryBuilder y su cadena de métodos
  const mockQueryBuilder = {
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    loadRelationCountAndMap: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  } as any;

  // 2. Mockeamos el Repositorio
  const mockProjectRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  } as any;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: getRepositoryToken(Project), useValue: mockProjectRepo },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ================= CREATE =================
  describe('create', () => {
    it('should successfully create a project', async () => {
      const dto = { name: 'New Project', description: 'Desc' };
      const newProject = { ...dto, organization: { id: 'org-1' } };
      const savedProject = { id: 'proj-1', ...newProject };

      mockProjectRepo.create.mockReturnValue(newProject);
      mockProjectRepo.save.mockResolvedValue(savedProject);

      const result = await service.create('org-1', dto as any);

      expect(mockProjectRepo.create).toHaveBeenCalledWith(newProject);
      expect(mockProjectRepo.save).toHaveBeenCalledWith(newProject);
      expect(result).toEqual(savedProject);
    });

    it('should throw InternalServerErrorException on error', async () => {
      mockProjectRepo.save.mockRejectedValue(new Error('DB Error'));

      await expect(service.create('org-1', { name: 'Test' } as any))
        .rejects.toThrow(InternalServerErrorException);
    });
  });

  // ================= FIND ALL BY ORG (QueryBuilder) =================
  describe('findAllByOrg', () => {
    it('should return a list of projects using QueryBuilder', async () => {
      const mockProjects = [{ id: 'proj-1', name: 'Project 1' }];
      mockQueryBuilder.getMany.mockResolvedValue(mockProjects);

      const result = await service.findAllByOrg('org-1');

      expect(mockProjectRepo.createQueryBuilder).toHaveBeenCalledWith('project');
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith('project.organization', 'organization');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('organization.id = :orgId', { orgId: 'org-1' });
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      expect(result).toEqual(mockProjects);
    });
  });

  // ================= FIND ONE =================
  describe('findOne', () => {
    it('should return a project if found', async () => {
      const project = { id: 'proj-1', name: 'Project 1' };
      mockProjectRepo.findOne.mockResolvedValue(project);

      const result = await service.findOne('org-1', 'proj-1');

      expect(mockProjectRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'proj-1', organization: { id: 'org-1' } },
      });
      expect(result).toEqual(project);
    });

    it('should throw NotFoundException if not found', async () => {
      mockProjectRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('org-1', 'invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ================= UPDATE =================
  describe('update', () => {
    it('should update and return the project', async () => {
      const existingProject = { id: 'proj-1', name: 'Old Name' };
      const updateDto = { name: 'New Name' };
      const updatedProject = { id: 'proj-1', name: 'New Name' };

      // Como tu método llama a findOne internamente:
      jest.spyOn(service, 'findOne').mockResolvedValue(existingProject as any);
      mockProjectRepo.save.mockResolvedValue(updatedProject);

      const result = await service.update('org-1', 'proj-1', updateDto);

      expect(service.findOne).toHaveBeenCalledWith('org-1', 'proj-1');
      expect(mockProjectRepo.save).toHaveBeenCalledWith(updatedProject);
      expect(result).toEqual(updatedProject);
    });
  });

  // ================= REMOVE =================
  describe('remove', () => {
    it('should remove the project', async () => {
      const project = { id: 'proj-1', name: 'To be deleted' };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(project as any);
      mockProjectRepo.remove.mockResolvedValue(project);

      const result = await service.remove('org-1', 'proj-1');

      expect(service.findOne).toHaveBeenCalledWith('org-1', 'proj-1');
      expect(mockProjectRepo.remove).toHaveBeenCalledWith(project);
      expect(result).toEqual({ message: 'Project deleted successfully' });
    });
  });
});