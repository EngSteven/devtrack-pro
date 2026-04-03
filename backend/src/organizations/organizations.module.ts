import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { Organization } from './entities/organization.entity';
import { Membership } from './entities/membership.entity';
import { UsersModule } from '../users/users.module';

@Module({
  // Importamos TypeOrmModule para que cree las tablas 'organizations' y 'memberships'
  imports: [TypeOrmModule.forFeature([Organization, Membership]), UsersModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [TypeOrmModule, OrganizationsService],
})
export class OrganizationsModule {}