import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

describe('UsersService', () => {
  let service: UsersService;

  // Creamos el Mock del Repositorio
  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    // Limpiamos los mocks antes de cada prueba
    jest.clearAllMocks(); 
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a new user', async () => {
      const userData = { name: 'Test User', email: 'test@example.com' };
      const savedUser = { id: '1', ...userData };

      mockUserRepository.create.mockReturnValue(savedUser);
      mockUserRepository.save.mockResolvedValue(savedUser);

      const result = await service.create(userData);

      expect(mockUserRepository.create).toHaveBeenCalledWith(userData);
      expect(mockUserRepository.save).toHaveBeenCalledWith(savedUser);
      expect(result).toEqual(savedUser);
    });
  });

  describe('findByEmail', () => {
    it('should return a user if found', async () => {
      const user = { id: '1', email: 'test@example.com' };
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.findByEmail('test@example.com');
      expect(result).toEqual(user);
    });

    it('should return null if user is not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      const result = await service.findByEmail('notfound@example.com');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return a user without password if found', async () => {
      const user = { id: '1', name: 'John', password: 'secretpassword' };
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.findById('1');
      
      // Verificamos que la contraseña fue eliminada del resultado
      expect(result).toEqual({ id: '1', name: 'John' });
      expect((result as any).password).toBeUndefined();
    });

    it('should return null if user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      const result = await service.findById('999');
      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update and return the user profile', async () => {
      const updateData = { name: 'New Name' };
      const updatedUser = { id: '1', name: 'New Name', password: 'hash' };

      mockUserRepository.update.mockResolvedValue({ affected: 1 });
      // findById internamente llama a findOne
      mockUserRepository.findOne.mockResolvedValue(updatedUser); 

      const result = await service.updateProfile('1', updateData);

      expect(mockUserRepository.update).toHaveBeenCalledWith('1', updateData);
      expect(result).toEqual({ id: '1', name: 'New Name' }); // Sin password
    });
  });

  describe('findByResetToken', () => {
    it('should return a user by reset token', async () => {
      const user = { id: '1', resetPasswordToken: 'token123' };
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.findByResetToken('token123');
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { resetPasswordToken: 'token123' } });
      expect(result).toEqual(user);
    });
  });

  describe('remove', () => {
    it('should successfully delete a user', async () => {
      const user = { id: '1', name: 'John' };
      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove('1');

      expect(mockUserRepository.delete).toHaveBeenCalledWith('1');
      expect(result).toEqual({ message: 'Account deleted successfully' });
    });

    it('should throw NotFoundException if user to delete is not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.delete).not.toHaveBeenCalled();
    });
  });
});