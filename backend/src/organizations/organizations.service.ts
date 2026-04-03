import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { Membership } from './entities/membership.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Role } from './enums/role.enum';
import { UsersService } from '../users/users.service';
import { AddMemberDto } from './dto/add-member.dto';
import { MembershipStatus } from './enums/role.enum';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
    
    @InjectRepository(Membership)
    private membershipRepository: Repository<Membership>,

    private usersService: UsersService,

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
        status: MembershipStatus.ACTIVE,
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
      where: { 
        user: { id: userId },
        status: MembershipStatus.ACTIVE // Solo mostramos las organizaciones a las que el usuario ya pertenece, no las invitaciones pendientes 
      },
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

  // 1. Obtener todos los miembros de la organización
  async getMembers(organizationId: string) {
    const memberships = await this.membershipRepository.find({
      where: { organization: { id: organizationId } },
      relations: ['user'], // Traemos los datos del usuario
    });

    // Limpiamos los datos para no enviar contraseñas al frontend
    return memberships.map(m => ({
      membershipId: m.id,
      role: m.role,
      joinedAt: m.joinedAt,
      user: {
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
      }
    }));
  }

  // 2. Añadir un usuario a la organización
  async addMember(organizationId: string, addMemberDto: AddMemberDto) {
    // A) Buscar si el usuario existe en DevTrack Pro
    const user = await this.usersService.findByEmail(addMemberDto.email);
    if (!user) {
      throw new NotFoundException('No user found with that email');
    }

    // B) Verificar si ya está en la organización
    const existingMembership = await this.membershipRepository.findOne({
      where: { user: { id: user.id }, organization: { id: organizationId } }
    });
    
    if (existingMembership) {
      throw new BadRequestException('The user already belongs to this organization');
    }

    // C) Evitar que se invite a otro OWNER (Solo puede haber un dueño)
    if (addMemberDto.role === Role.OWNER) {
      throw new BadRequestException('You cannot invite another Owner');
    }

    // D) Crear la membresía
    const newMembership = this.membershipRepository.create({
      role: addMemberDto.role,
      user: { id: user.id },
      organization: { id: organizationId }
    });

    return this.membershipRepository.save(newMembership);
  }

  // 3. Eliminar un miembro
  async removeMember(organizationId: string, membershipId: string) {
    const membership = await this.membershipRepository.findOne({
      where: { id: membershipId, organization: { id: organizationId } }
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    if (membership.role === Role.OWNER) {
      throw new BadRequestException('You cannot remove the Owner of the organization');
    }

    await this.membershipRepository.remove(membership);
    return { message: 'Member removed successfully' };
  }

  // 1. Obtener invitaciones pendientes del usuario
  async getMyInvitations(userId: string) {
    return this.membershipRepository.find({
      where: { user: { id: userId }, status: MembershipStatus.PENDING },
      relations: ['organization'],
    });
  }

  // 2. Aceptar o Rechazar invitación
  async respondToInvitation(userId: string, membershipId: string, accept: boolean) {
    const membership = await this.membershipRepository.findOne({
      where: { id: membershipId, user: { id: userId }, status: MembershipStatus.PENDING }
    });

    if (!membership) throw new NotFoundException('Invitation not found');

    if (accept) {
      membership.status = MembershipStatus.ACTIVE;
      return this.membershipRepository.save(membership);
    } else {
      await this.membershipRepository.remove(membership);
      return { message: 'Invitation rejected' };
    }
  }

  // 3. Cambiar el rol de un usuario
  async updateMemberRole(organizationId: string, membershipId: string, newRole: Role) {
    const membership = await this.membershipRepository.findOne({
      where: { id: membershipId, organization: { id: organizationId } }
    });

    if (!membership) throw new NotFoundException('Member not found');
    if (membership.role === Role.OWNER) throw new BadRequestException('You cannot change the role of the Owner');
    if (newRole === Role.OWNER) throw new BadRequestException('Use the property transfer function to assign a new Owner');

    membership.role = newRole;
    return this.membershipRepository.save(membership);
  }

  // 4. Abandonar la organización
  async leaveOrganization(organizationId: string, userId: string) {
    const membership = await this.membershipRepository.findOne({
      where: { user: { id: userId }, organization: { id: organizationId } }
    });

    if (!membership) throw new NotFoundException('You are not a member of this organization');

    // Manejo del caso OWNER
    if (membership.role === Role.OWNER) {
      // Contamos cuántos propietarios hay
      const ownersCount = await this.membershipRepository.count({
        where: { organization: { id: organizationId }, role: Role.OWNER }
      });

      if (ownersCount <= 1) {
        throw new BadRequestException('You are the only owner. Transfer ownership or delete the organization to be able to leave.');
      }
    }

    await this.membershipRepository.remove(membership);
    return { message: 'You have left the organization successfully' };
  }

}