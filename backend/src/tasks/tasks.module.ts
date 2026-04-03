import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './entities/task.entity';
import { ProjectsModule } from '../projects/projects.module'; // Para futuras validaciones
import { OrganizationsModule } from 'src/organizations/organizations.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([Task]), // Le decimos a TypeORM que cree la tabla
    ProjectsModule,
    OrganizationsModule, // Para validar roles y permisos en el futuro
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}