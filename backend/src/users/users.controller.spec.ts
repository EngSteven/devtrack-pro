import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  // Mock del UsersService
  const mockUsersService = {
    findById: jest.fn(),
    updateProfile: jest.fn(),
    remove: jest.fn(),
  } as any;

  // Objeto Request (req) falso emulando lo que inyecta el AuthGuard
  const mockRequest = {
    user: { sub: 'user-123' },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
      ],
    })
      // Ignoramos el AuthGuard en la prueba unitaria
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should call service.findById with the user ID from the request', async () => {
      const expectedUser = { id: 'user-123', name: 'John Doe', email: 'john@test.com' };
      mockUsersService.findById.mockResolvedValue(expectedUser);

      const result = await controller.getProfile(mockRequest);

      expect(service.findById).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(expectedUser);
    });
  });

  describe('updateProfile', () => {
    it('should call service.updateProfile with the user ID and new data', async () => {
      const updateData = { name: 'John Updated' };
      const expectedUser = { id: 'user-123', name: 'John Updated' };
      mockUsersService.updateProfile.mockResolvedValue(expectedUser);

      const result = await controller.updateProfile(mockRequest, updateData);

      expect(service.updateProfile).toHaveBeenCalledWith('user-123', updateData);
      expect(result).toEqual(expectedUser);
    });
  });

  describe('deleteAccount', () => {
    it('should call service.remove with the user ID', async () => {
      const expectedResponse = { message: 'Account deleted successfully' };
      mockUsersService.remove.mockResolvedValue(expectedResponse);

      const result = await controller.deleteAccount(mockRequest);

      expect(service.remove).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(expectedResponse);
    });
  });
});