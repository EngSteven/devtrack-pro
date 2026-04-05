import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Role } from './enums/role.enum';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

describe('OrganizationsController', () => {
  let controller: OrganizationsController;
  let service: jest.Mocked<OrganizationsService>;

  const mockService = {
    create: jest.fn(),
    findAllForUser: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getMembers: jest.fn(),
    addMember: jest.fn(),
    removeMember: jest.fn(),
    getMyInvitations: jest.fn(),
    respondToInvitation: jest.fn(),
    updateMemberRole: jest.fn(),
    leaveOrganization: jest.fn(),
  } as any;

  const mockRequest = {
    user: {
      sub: 'user-1',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationsController],
      providers: [
        {
          provide: OrganizationsService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(OrganizationsController);
    service = module.get(OrganizationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create organization', async () => {
    const dto = { name: 'Org test' };

    await controller.create(dto as any, mockRequest);

    expect(service.create).toHaveBeenCalledWith(dto, 'user-1');
  });

  it('should return organizations for user', async () => {
    await controller.findAllMine(mockRequest);

    expect(service.findAllForUser).toHaveBeenCalledWith('user-1');
  });

  it('should update organization', async () => {
    const dto = { name: 'Updated name' };

    await controller.update('org-1', dto as any);

    expect(service.update).toHaveBeenCalledWith('org-1', dto);
  });

  it('should remove organization', async () => {
    await controller.remove('org-1');

    expect(service.remove).toHaveBeenCalledWith('org-1');
  });

  it('should get members', async () => {
    await controller.getMembers('org-1');

    expect(service.getMembers).toHaveBeenCalledWith('org-1');
  });

  it('should add member', async () => {
    const dto = { email: 'test@mail.com', role: Role.MEMBER };

    await controller.addMember('org-1', dto as any);

    expect(service.addMember).toHaveBeenCalledWith('org-1', dto);
  });

  it('should remove member', async () => {
    await controller.removeMember('org-1', 'membership-1');

    expect(service.removeMember).toHaveBeenCalledWith(
      'org-1',
      'membership-1',
    );
  });

  it('should get invitations', async () => {
    await controller.getMyInvitations(mockRequest);

    expect(service.getMyInvitations).toHaveBeenCalledWith('user-1');
  });

  it('should accept invitation', async () => {
    await controller.acceptInvitation(mockRequest, 'membership-1');

    expect(service.respondToInvitation).toHaveBeenCalledWith(
      'user-1',
      'membership-1',
      true,
    );
  });

  it('should reject invitation', async () => {
    await controller.rejectInvitation(mockRequest, 'membership-1');

    expect(service.respondToInvitation).toHaveBeenCalledWith(
      'user-1',
      'membership-1',
      false,
    );
  });

  it('should update member role', async () => {
    await controller.updateMemberRole(
      'org-1',
      'membership-1',
      Role.ADMIN,
    );

    expect(service.updateMemberRole).toHaveBeenCalledWith(
      'org-1',
      'membership-1',
      Role.ADMIN,
    );
  });

  it('should leave organization', async () => {
    await controller.leaveOrganization(mockRequest, 'org-1');

    expect(service.leaveOrganization).toHaveBeenCalledWith(
      'org-1',
      'user-1',
    );
  });
});