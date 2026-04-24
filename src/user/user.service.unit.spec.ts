import * as bcrypt from 'bcrypt';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService } from './user.service';
import { prismaMock } from '../__tests__/prisma.mock';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from '../common/errors';

vi.mock('bcrypt', () => ({
  hash: vi.fn().mockResolvedValue('hashed_password'),
  compare: vi.fn(),
}));

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService(prismaMock as any);
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return array of users without passwords', async () => {
      const mockUsers = [
        {
          id: '123',
          login: 'testuser',
          password: 'hashed',
          role: 'VIEWER',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      prismaMock.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('password');
      expect(result[0].role).toBe('viewer');
    });
  });

  describe('findOne', () => {
    it('should throw ValidationError for invalid UUID', async () => {
      await expect(service.findOne('not-a-uuid')).rejects.toThrow(
        ValidationError,
      );
    });

    it('should throw NotFoundError when user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('550e8400-e29b-41d4-a716-446655440000'),
      ).rejects.toThrow(NotFoundError);
    });

    it('should return user without password when found', async () => {
      const mockUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        login: 'testuser',
        password: 'hashed',
        role: 'VIEWER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne(mockUser.id);

      expect(result.login).toBe('testuser');
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('create', () => {
    it('should hash password and assign default role', async () => {
      const mockUser = {
        id: '123',
        login: 'newuser',
        password: 'hashed_password',
        role: 'VIEWER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.user.create.mockResolvedValue(mockUser);

      const result = await service.create('newuser', 'plaintext');

      expect(bcrypt.hash).toHaveBeenCalledWith('plaintext', expect.any(Number));
      expect(result.role).toBe('viewer');
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('updatePassword', () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';
    const mockUser = {
      id: userId,
      login: 'testuser',
      password: 'hashed_old',
      role: 'VIEWER',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should throw ValidationError for invalid UUID', async () => {
      await expect(
        service.updatePassword('bad-id', 'old', 'new'),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError when user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updatePassword(userId, 'old', 'new'),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError when old password is wrong', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(
        service.updatePassword(userId, 'wrong', 'new'),
      ).rejects.toThrow(ForbiddenError);
    });

    it('should update password when old password matches', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(true);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        password: 'hashed_new',
        updatedAt: new Date(),
      });

      const result = await service.updatePassword(userId, 'old', 'new');

      expect(result).not.toHaveProperty('password');
      expect(bcrypt.hash).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';

    it('should throw ValidationError for invalid UUID', async () => {
      await expect(service.delete('bad-id')).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError when user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.delete(userId)).rejects.toThrow(NotFoundError);
    });

    it('should delete user and cascade', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: userId });
      prismaMock.$transaction.mockResolvedValue(undefined);

      await service.delete(userId);

      expect(prismaMock.$transaction).toHaveBeenCalled();
    });
  });
});
