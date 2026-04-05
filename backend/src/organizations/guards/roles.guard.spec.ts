import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { Repository } from 'typeorm';
import { ForbiddenException } from '@nestjs/common';
import { Role } from '../enums/role.enum';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

describe('RolesGuard', () => {
  let guard: RolesGuard;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  } as any;

  const mockMembershipRepository = {
    findOne: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new RolesGuard(mockReflector, mockMembershipRepository);
  });

  const createContext = (request: any) =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any);

  // ================= NO ROLES =================
  it('should allow access if no roles are required', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);

    const context = createContext({});

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });

  // ================= NO ORG ID =================
  it('should throw if organizationId is missing', async () => {
    mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

    const context = createContext({
      user: { sub: 1 },
      params: {},
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  // ================= NO MEMBERSHIP =================
  it('should throw if user does not belong to organization', async () => {
    mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

    mockMembershipRepository.findOne.mockResolvedValue(null);

    const context = createContext({
      user: { sub: 1 },
      params: { id: 1 },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  // ================= NOT ACTIVE =================
  it('should throw if membership is not active', async () => {
    mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

    mockMembershipRepository.findOne.mockResolvedValue({
      status: 'PENDING',
      role: Role.ADMIN,
    });

    const context = createContext({
      user: { sub: 1 },
      params: { id: 1 },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  // ================= WRONG ROLE =================
  it('should throw if user does not have required role', async () => {
    mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

    mockMembershipRepository.findOne.mockResolvedValue({
      status: 'ACTIVE',
      role: Role.MEMBER,
    });

    const context = createContext({
      user: { sub: 1 },
      params: { id: 1 },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  // ================= SUCCESS =================
  it('should allow access and attach membership if valid', async () => {
    const membership = {
      status: 'ACTIVE',
      role: Role.ADMIN,
    };

    mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

    mockMembershipRepository.findOne.mockResolvedValue(membership);

    const request: any = {
      user: { sub: 1 },
      params: { id: 1 },
    };

    const context = createContext(request);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.membership).toEqual(membership);
  });
});

