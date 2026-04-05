import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  // Mock de todo el AuthService
  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  } as any;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should call authService.login', async () => {
      const dto = { email: 'test@test.com', password: '123' };
      mockAuthService.login.mockResolvedValue({ access_token: 'token' });

      const result = await controller.login(dto);

      expect(service.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ access_token: 'token' });
    });
  });

  describe('register', () => {
    it('should call authService.register', async () => {
      const dto = { name: 'Test', email: 'test@test.com', password: '123' };
      mockAuthService.register.mockResolvedValue({ access_token: 'token' });

      const result = await controller.register(dto);

      expect(service.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ access_token: 'token' });
    });
  });

  describe('forgotPassword', () => {
    it('should call authService.forgotPassword', async () => {
      const expectedMessage = { message: 'Link sent' };
      mockAuthService.forgotPassword.mockResolvedValue(expectedMessage);

      const result = await controller.forgotPassword('test@test.com');

      expect(service.forgotPassword).toHaveBeenCalledWith('test@test.com');
      expect(result).toEqual(expectedMessage);
    });
  });

  describe('resetPassword', () => {
    it('should call authService.resetPassword', async () => {
      const body = { token: 'abc', newPassword: '123' };
      const expectedMessage = { message: 'Password reset' };
      mockAuthService.resetPassword.mockResolvedValue(expectedMessage);

      const result = await controller.resetPassword(body);

      expect(service.resetPassword).toHaveBeenCalledWith('abc', '123');
      expect(result).toEqual(expectedMessage);
    });
  });
});