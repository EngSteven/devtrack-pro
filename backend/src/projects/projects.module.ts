import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Project } from './entities/project.entity';
import { OrganizationsModule } from '../organizations/organizations.module'; // 👈 Importamos el módulo hermano

@Module({
  imports: [
    TypeOrmModule.forFeature([Project]), // Registramos nuestra tabla
    OrganizationsModule, // Nos da acceso al RolesGuard y Memberships
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}