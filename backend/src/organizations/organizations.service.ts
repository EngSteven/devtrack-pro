import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { Membership } from './entities/membership.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Role } from './enums/role.enum';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
    
    @InjectRepository(Membership)
    private membershipRepository: Repository<Membership>,
  ) {}

  // Nota cómo recibimos el DTO y, además, el ID del usuario que está haciendo la petición
  async create(createOrganizationDto: CreateOrganizationDto, userId: string) {
    try {
      // 1. Creamos y guardamos la organización
      const newOrg = this.orgRepository.create({
        name: createOrganizationDto.name,
      });
      const savedOrg = await this.orgRepository.save(newOrg);

      // 2. Creamos la membresía (El puente entre este usuario y esta nueva organización)
      const newMembership = this.membershipRepository.create({
        role: Role.OWNER, // Le damos el rol máximo por ser el creador
        user: { id: userId }, // TypeORM es inteligente: con solo pasarle el ID, hace la relación
        organization: { id: savedOrg.id },
      });
      await this.membershipRepository.save(newMembership);

      return savedOrg;
    } catch (error) {
      throw new InternalServerErrorException('Error creating organization');
    }
  }

  // Método extra: Para que el usuario pueda ver a qué organizaciones pertenece
  async findAllForUser(userId: string) {
    // Buscamos todas las membresías de este usuario e incluimos los datos de la organización
    const memberships = await this.membershipRepository.find({
      where: { user: { id: userId } },
      relations: ['organization'], // Esto hace un JOIN en SQL por debajo
    });

    // Limpiamos la respuesta para devolver solo un arreglo de organizaciones con su respectivo rol
    return memberships.map(m => ({
      ...m.organization,
      myRole: m.role,
    }));
  }

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto) {
    // Buscamos la organización
    const org = await this.orgRepository.findOne({ where: { id } });
    if (!org) {
      throw new InternalServerErrorException('Organization not found');
    }

    // Actualizamos el nombre y guardamos
    org.name = updateOrganizationDto.name;
    return this.orgRepository.save(org);
  }

  async remove(id: string) {
    const org = await this.orgRepository.findOne({ where: { id } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    // Al borrarla, gracias al onDelete: 'CASCADE' que pusimos, se borrarán todos sus proyectos y membresías automáticamente.
    await this.orgRepository.remove(org);
    return { message: 'Organization deleted successfully' };
  }

}