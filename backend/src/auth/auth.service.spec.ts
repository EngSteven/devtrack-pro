
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import {
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';


// MOCK GLOBAL DE BCRYPT (CLAVE)
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  genSalt: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findByResetToken: jest.fn(),
  } as any;

  const mockJwtService = {
    signAsync: jest.fn(),
  } as any;

  const mockMailService = {
    sendPasswordResetEmail: jest.fn(),
  } as any;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ================= LOGIN =================
  describe('login', () => {
    it('should throw if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'test@test.com', password: '123456' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if password is invalid', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        password: 'hashed',
      });

      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return access token if valid', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        name: 'Test',
        password: 'hashed',
      });

      (bcrypt.compare as any).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue('token');

      const result = await service.login({
        email: 'test@test.com',
        password: '123456',
      });

      expect(result).toEqual({ access_token: 'token' });
    });
  });

  // ================= REGISTER =================
  describe('register', () => {
    it('should throw if email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue({});

      await expect(
        service.register({
          email: 'test@test.com',
          password: '123456',
          name: 'Test',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create user and return token', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      mockUsersService.create.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
      });

      (bcrypt.genSalt as any).mockResolvedValue('salt');
      (bcrypt.hash as any).mockResolvedValue('hashed');

      mockJwtService.signAsync.mockResolvedValue('token');

      const result = await service.register({
        email: 'test@test.com',
        password: '123456',
        name: 'Test',
      });

      expect(mockUsersService.create).toHaveBeenCalled();
      expect(result).toEqual({ access_token: 'token' });
    });
  });

  // ================= FORGOT PASSWORD =================
  describe('forgotPassword', () => {
    it('should return success even if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.forgotPassword('test@test.com');

      expect(result).toEqual({
        message: 'If that email exists, we have sent a reset link.',
      });
    });

    it('should generate token and send email', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
      });

      const result = await service.forgotPassword('test@test.com');

      expect(mockUsersService.update).toHaveBeenCalled();
      expect(mockMailService.sendPasswordResetEmail).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'If that email exists, we have sent a reset link.',
      });
    });
  });

  // ================= RESET PASSWORD =================
  describe('resetPassword', () => {
    it('should throw if token is invalid', async () => {
      mockUsersService.findByResetToken.mockResolvedValue(null);

      await expect(
        service.resetPassword('token', 'newpass'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if token is expired', async () => {
      mockUsersService.findByResetToken.mockResolvedValue({
        resetPasswordExpires: new Date(Date.now() - 1000),
      });

      await expect(
        service.resetPassword('token', 'newpass'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reset password successfully', async () => {
      mockUsersService.findByResetToken.mockResolvedValue({
        id: 1,
        resetPasswordExpires: new Date(Date.now() + 100000),
      });

      (bcrypt.genSalt as any).mockResolvedValue('salt');
      (bcrypt.hash as any).mockResolvedValue('hashed');

      const result = await service.resetPassword('token', 'newpass');

      expect(mockUsersService.update).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Password has been successfully reset',
      });
    });
  });
});

