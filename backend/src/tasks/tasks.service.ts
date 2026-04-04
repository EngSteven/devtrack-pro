import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AnalyticsService } from 'src/analytics/analytics.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private analyticsService: AnalyticsService,
  ) {}

  async create(projectId: string, createTaskDto: CreateTaskDto) {
    const { assigneeId, ...taskData } = createTaskDto;
    
    const newTask = this.taskRepository.create({
      ...taskData,
      project: { id: projectId }, // Vinculamos al proyecto
      // Si enviaron un assigneeId, lo vinculamos. Si no, queda null.
      assignee: assigneeId ? { id: assigneeId } : undefined, 
    });

    return this.taskRepository.save(newTask);
  }

  async findAllByProject(projectId: string) {
    return this.taskRepository.find({
      where: { project: { id: projectId } },
      relations: ['assignee'], // Traemos los datos del usuario asignado para mostrar su avatar
      order: { position: 'ASC', createdAt: 'DESC' }, // Ordenamos por posición y luego por fecha de creación
    });
  }

  async update(taskId: string, updateTaskDto: UpdateTaskDto) {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');

    const previousStatus = task.status;

    const { assigneeId, ...taskData } = updateTaskDto;
    
    Object.assign(task, taskData);

    if (assigneeId !== undefined) {
      task.assignee = assigneeId ? ({ id: assigneeId } as any) : null;
    }

    // 1. Guardamos los cambios
    await this.taskRepository.save(task);

    // 2. Volvemos a buscar la tarea incluyendo las relaciones completas
    const updatedTask = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['assignee', 'project', 'project.organization'],
    });

    if (!updatedTask) {
      throw new NotFoundException('Task not found after update');
    }

    if (updateTaskDto.status && updateTaskDto.status !== previousStatus) {
      // Ejecutamos en segundo plano (sin await) para no penalizar la velocidad de la petición HTTP
      this.analyticsService.logEvent({
        orgId: updatedTask.project.organization.id, // Asegúrate de que TypeORM esté trayendo esta relación
        projectId: updatedTask.project.id,
        userId: updatedTask.assignee?.id,
        action: updatedTask.status === 'DONE' ? 'TASK_COMPLETED' : 'TASK_MOVED',
        metadata: {
          taskId: updatedTask.id,
          taskTitle: updatedTask.title,
          fromStatus: previousStatus,
          toStatus: updatedTask.status,
          timeToComplete: updatedTask.status === 'DONE' ? (new Date().getTime() - new Date(updatedTask.createdAt).getTime()) : null
        }
      });
    }

    return updatedTask;
  }

  async remove(taskId: string) {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');
    await this.taskRepository.remove(task);
    return { message: 'Task deleted' };
  }
}