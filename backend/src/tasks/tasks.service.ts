import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
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
      order: { createdAt: 'DESC' },
    });
  }

  async update(taskId: string, updateTaskDto: UpdateTaskDto) {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');

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
      relations: ['assignee'],
    });

    return updatedTask;
  }

  async remove(taskId: string) {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');
    await this.taskRepository.remove(task);
    return { message: 'Task deleted' };
  }
}