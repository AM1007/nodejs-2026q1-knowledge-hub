import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service';
import { ValidationError, ForbiddenError } from '../common/errors';
import * as bcrypt from 'bcrypt';

vi.mock('bcrypt', () => ({
  compare: vi.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userServiceMock: any;
  let jwtServiceMock: any;

  beforeEach(() => {
    userServiceMock = {
      findByLogin: vi.fn(),
      create: vi.fn(),
    };

    jwtServiceMock = {
      signAsync: vi.fn(),
      verifyAsync: vi.fn(),
    };

    service = new AuthService(userServiceMock, jwtServiceMock);
    vi.clearAllMocks();
  });

  describe('signup', () => {
    it('should throw ValidationError when login is taken', async () => {
      userServiceMock.findByLogin.mockResolvedValue({
        id: '1',
        login: 'taken',
      });

      await expect(
        service.signup({ login: 'taken', password: 'pass' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should create user when login is available', async () => {
      userServiceMock.findByLogin.mockResolvedValue(null);
      userServiceMock.create.mockResolvedValue({
        id: '1',
        login: 'newuser',
        role: 'viewer',
      });

      const result = await service.signup({
        login: 'newuser',
        password: 'pass',
      });

      expect(userServiceMock.create).toHaveBeenCalledWith('newuser', 'pass');
      expect(result).toHaveProperty('login', 'newuser');
    });
  });

  describe('login', () => {
    it('should throw ForbiddenError when user not found', async () => {
      userServiceMock.findByLogin.mockResolvedValue(null);

      await expect(
        service.login({ login: 'nouser', password: 'pass' }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError when password is wrong', async () => {
      userServiceMock.findByLogin.mockResolvedValue({
        id: '1',
        login: 'user',
        password: 'hashed',
        role: 'VIEWER',
      });
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(
        service.login({ login: 'user', password: 'wrong' }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('should return tokens when credentials are valid', async () => {
      userServiceMock.findByLogin.mockResolvedValue({
        id: '1',
        login: 'user',
        password: 'hashed',
        role: 'VIEWER',
      });
      (bcrypt.compare as any).mockResolvedValue(true);
      jwtServiceMock.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.login({ login: 'user', password: 'pass' });

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });
  });

  describe('refresh', () => {
    it('should throw ForbiddenError for invalid refresh token', async () => {
      jwtServiceMock.verifyAsync.mockRejectedValue(new Error('invalid'));

      await expect(service.refresh('bad-token')).rejects.toThrow(
        ForbiddenError,
      );
    });

    it('should return new tokens for valid refresh token', async () => {
      jwtServiceMock.verifyAsync.mockResolvedValue({
        userId: '1',
        login: 'user',
        role: 'viewer',
      });
      jwtServiceMock.signAsync
        .mockResolvedValueOnce('new-access')
        .mockResolvedValueOnce('new-refresh');

      const result = await service.refresh('valid-refresh-token');

      expect(result).toEqual({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });
    });

    it('should throw ForbiddenError for revoked token', async () => {
      await service.logout('revoked-token');

      await expect(service.refresh('revoked-token')).rejects.toThrow(
        ForbiddenError,
      );
    });
  });

  describe('logout', () => {
    it('should blacklist the refresh token', async () => {
      await service.logout('some-token');

      await expect(service.refresh('some-token')).rejects.toThrow(
        ForbiddenError,
      );
    });
  });
});
