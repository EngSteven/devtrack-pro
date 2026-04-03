import { Controller, Post, Body, Param, UseGuards, Get } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';

// Importamos nuestras herramientas de seguridad
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../organizations/guards/roles.guard';
import { Roles } from '../organizations/decorators/roles.decorator';
import { Role } from '../organizations/enums/role.enum';

@UseGuards(AuthGuard, RolesGuard) // Doble seguridad activada para toda la ruta
@Controller('organizations/:id/projects') // Diseño RESTful: El proyecto vive dentro de la org
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Roles(Role.OWNER, Role.ADMIN) // Solo jefes pueden crear proyectos
  @Post()
  create(
    @Param('id') organizationId: string, 
    @Body() createProjectDto: CreateProjectDto
  ) {
    return this.projectsService.create(organizationId, createProjectDto);
  }

  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER) // Todos los miembros pueden ver
  @Get()
  findAll(@Param('id') organizationId: string) {
    return this.projectsService.findAllByOrg(organizationId);
  }
}