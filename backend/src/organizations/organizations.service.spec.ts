import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsService } from './organizations.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { Membership } from './entities/membership.entity';
import { UsersService } from '../users/users.service';
import { Role, MembershipStatus } from './enums/role.enum';
import { NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

describe('OrganizationsService', () => {
  let service: OrganizationsService;

  const mockOrgRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  } as any;

  const mockMembershipRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  } as any;

  const mockUsersService = {
    findByEmail: jest.fn(),
  } as any;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: getRepositoryToken(Organization), useValue: mockOrgRepo },
        { provide: getRepositoryToken(Membership), useValue: mockMembershipRepo },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
  });

  // ================= TUS PRUEBAS ORIGINALES (CREATE, FIND, UPDATE, REMOVE) =================
  describe('create', () => {
    it('should create an organization', async () => {
      mockOrgRepo.create.mockReturnValue({ name: 'Org' });
      mockOrgRepo.save.mockResolvedValue({ id: '1', name: 'Org' });
      mockMembershipRepo.create.mockReturnValue({});
      mockMembershipRepo.save.mockResolvedValue({});
      
      const res = await service.create({ name: 'Org' }, 'user-1');
      expect(res.id).toEqual('1');
    });
  });

  describe('findAllForUser', () => {
    it('should return mapped orgs', async () => {
      mockMembershipRepo.find.mockResolvedValue([{ role: Role.ADMIN, organization: { id: '1' } }]);
      const res = await service.findAllForUser('u1');
      expect(res[0].myRole).toEqual(Role.ADMIN);
    });
  });

  describe('update', () => {
    it('should update an organization', async () => {
      mockOrgRepo.findOne.mockResolvedValue({ id: '1' });
      mockOrgRepo.save.mockResolvedValue({ id: '1', name: 'New' });
      const res = await service.update('1', { name: 'New' });
      expect(res.name).toEqual('New');
    });
  });

  describe('remove', () => {
    it('should remove an organization', async () => {
      mockOrgRepo.findOne.mockResolvedValue({ id: '1' });
      const res = await service.remove('1');
      expect(res.message).toBeDefined();
    });
  });

  // ================= ¡NUEVO! TEAM & ROLES =================
  describe('getMembers', () => {
    it('should map members without password', async () => {
      mockMembershipRepo.find.mockResolvedValue([
        { id: 'm1', role: Role.MEMBER, joinedAt: new Date(), user: { id: 'u1', name: 'A', email: 'a@a.com', password: '123' } }
      ]);
      const res = await service.getMembers('org-1');
      expect(res[0].user.name).toBe('A');
      expect((res[0].user as any).password).toBeUndefined();
    });
  });

  describe('addMember', () => {
    it('throws if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(service.addMember('org-1', { email: 'a@a.com', role: Role.MEMBER })).rejects.toThrow(NotFoundException);
    });

    it('throws if already member', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: 'u1' });
      mockMembershipRepo.findOne.mockResolvedValue({}); // Ya existe
      await expect(service.addMember('org-1', { email: 'a@a.com', role: Role.MEMBER })).rejects.toThrow(BadRequestException);
    });

    it('throws if inviting OWNER', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: 'u1' });
      mockMembershipRepo.findOne.mockResolvedValue(null);
      await expect(service.addMember('org-1', { email: 'a@a.com', role: Role.OWNER })).rejects.toThrow(BadRequestException);
    });

    it('creates membership successfully', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: 'u1' });
      mockMembershipRepo.findOne.mockResolvedValue(null);
      mockMembershipRepo.save.mockResolvedValue({ id: 'm1' });
      const res = await service.addMember('org-1', { email: 'a@a.com', role: Role.MEMBER });
      expect(mockMembershipRepo.save).toHaveBeenCalled();
    });
  });

  describe('removeMember', () => {
    it('throws if trying to remove OWNER', async () => {
      mockMembershipRepo.findOne.mockResolvedValue({ role: Role.OWNER });
      await expect(service.removeMember('org-1', 'm1')).rejects.toThrow(BadRequestException);
    });

    it('removes member successfully', async () => {
      mockMembershipRepo.findOne.mockResolvedValue({ role: Role.MEMBER });
      const res = await service.removeMember('org-1', 'm1');
      expect(mockMembershipRepo.remove).toHaveBeenCalled();
      expect(res.message).toBe('Member removed successfully');
    });
  });

  describe('getMyInvitations & respondToInvitation', () => {
    it('fetches invitations', async () => {
      mockMembershipRepo.find.mockResolvedValue([{ id: 'inv-1' }]);
      const res = await service.getMyInvitations('u1');
      expect(res.length).toBe(1);
    });

    it('accepts invitation', async () => {
      mockMembershipRepo.findOne.mockResolvedValue({ status: MembershipStatus.PENDING });
      mockMembershipRepo.save.mockResolvedValue({ status: MembershipStatus.ACTIVE });
      const res = await service.respondToInvitation('u1', 'm1', true);
      expect(mockMembershipRepo.save).toHaveBeenCalled();
    });

    it('rejects invitation', async () => {
      mockMembershipRepo.findOne.mockResolvedValue({ status: MembershipStatus.PENDING });
      const res = await service.respondToInvitation('u1', 'm1', false);
      expect(mockMembershipRepo.remove).toHaveBeenCalled();
    });
  });

  describe('updateMemberRole', () => {
    it('throws if changing OWNER role', async () => {
      mockMembershipRepo.findOne.mockResolvedValue({ role: Role.OWNER });
      await expect(service.updateMemberRole('org-1', 'm1', Role.ADMIN)).rejects.toThrow(BadRequestException);
    });

    it('throws if assigning OWNER role', async () => {
      mockMembershipRepo.findOne.mockResolvedValue({ role: Role.MEMBER });
      await expect(service.updateMemberRole('org-1', 'm1', Role.OWNER)).rejects.toThrow(BadRequestException);
    });

    it('updates role successfully', async () => {
      mockMembershipRepo.findOne.mockResolvedValue({ role: Role.MEMBER });
      mockMembershipRepo.save.mockResolvedValue({ role: Role.ADMIN });
      await service.updateMemberRole('org-1', 'm1', Role.ADMIN);
      expect(mockMembershipRepo.save).toHaveBeenCalled();
    });
  });

  describe('leaveOrganization', () => {
    it('throws if the only OWNER tries to leave', async () => {
      mockMembershipRepo.findOne.mockResolvedValue({ role: Role.OWNER });
      mockMembershipRepo.count.mockResolvedValue(1); // Es el único
      await expect(service.leaveOrganization('org-1', 'u1')).rejects.toThrow(BadRequestException);
    });

    it('allows OWNER to leave if there are others', async () => {
      mockMembershipRepo.findOne.mockResolvedValue({ role: Role.OWNER });
      mockMembershipRepo.count.mockResolvedValue(2); // Hay otro dueño
      await service.leaveOrganization('org-1', 'u1');
      expect(mockMembershipRepo.remove).toHaveBeenCalled();
    });
  });
});