import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';

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
}