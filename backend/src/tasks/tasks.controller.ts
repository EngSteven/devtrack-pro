import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

// Herramientas de seguridad
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../organizations/guards/roles.guard';
import { Roles } from '../organizations/decorators/roles.decorator';
import { Role } from '../organizations/enums/role.enum';

@UseGuards(AuthGuard, RolesGuard)
@Controller('organizations/:id/projects/:projectId/tasks') 
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER) // Viewers no pueden crear tareas
  @Post()
  create(
    @Param('projectId') projectId: string, 
    @Body() createTaskDto: CreateTaskDto
  ) {
    return this.tasksService.create(projectId, createTaskDto);
  }

  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER) // Todos pueden ver el tablero Kanban
  @Get()
  findAll(@Param('projectId') projectId: string) {
    return this.tasksService.findAllByProject(projectId);
  }

  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER) // Viewers no pueden mover ni editar tareas
  @Patch(':taskId')
  update(
    @Param('taskId') taskId: string, 
    @Body() updateTaskDto: UpdateTaskDto
  ) {
    return this.tasksService.update(taskId, updateTaskDto);
  }

  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER) // Los miembros pueden borrar tareas (o podrías restringirlo solo a Admin/Owner)
  @Delete(':taskId')
  remove(@Param('taskId') taskId: string) {
    return this.tasksService.remove(taskId);
  }
}