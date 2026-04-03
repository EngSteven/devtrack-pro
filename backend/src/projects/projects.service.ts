import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  async create(organizationId: string, createProjectDto: CreateProjectDto) {
    try {
      const newProject = this.projectRepository.create({
        ...createProjectDto,
        // Vinculamos el proyecto a la organización
        organization: { id: organizationId }, 
      });
      return await this.projectRepository.save(newProject);
    } catch (error) {
      throw new InternalServerErrorException('Error creating project');
    }
  }

  async findAllByOrg(organizationId: string) {
    return this.projectRepository.find({
      where: { organization: { id: organizationId } },
      order: { createdAt: 'DESC' }, // Los más recientes primero
    });
  }

  async findOne(organizationId: string, projectId: string) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, organization: { id: organizationId } },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(organizationId: string, projectId: string, updateProjectDto: UpdateProjectDto) {
    const project = await this.findOne(organizationId, projectId); // Reutilizamos la búsqueda segura
    
    // Combinamos los datos viejos con los nuevos
    const updatedProject = Object.assign(project, updateProjectDto);
    return this.projectRepository.save(updatedProject);
  }

  async remove(organizationId: string, projectId: string) {
    const project = await this.findOne(organizationId, projectId);
    await this.projectRepository.remove(project);
    return { message: 'Project deleted successfully' };
  }


}