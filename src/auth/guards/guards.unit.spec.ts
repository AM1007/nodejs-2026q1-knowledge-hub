import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtServiceMock: any;
  let reflectorMock: any;

  const createMockContext = (headers: Record<string, string> = {}) => {
    const request = { headers, user: null };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;
  };

  beforeEach(() => {
    jwtServiceMock = {
      verifyAsync: vi.fn(),
    };

    reflectorMock = {
      getAllAndOverride: vi.fn().mockReturnValue(false),
    };

    guard = new JwtAuthGuard(jwtServiceMock, reflectorMock);
    vi.clearAllMocks();
  });

  it('should allow access for @Public() routes', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(true);

    const result = await guard.canActivate(createMockContext());

    expect(result).toBe(true);
  });

  it('should throw UnauthorizedException when no token', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);

    await expect(guard.canActivate(createMockContext())).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException for malformed header', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);

    await expect(
      guard.canActivate(
        createMockContext({ authorization: 'NotBearer token' }),
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException for expired token', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);
    jwtServiceMock.verifyAsync.mockRejectedValue(new Error('expired'));

    await expect(
      guard.canActivate(
        createMockContext({ authorization: 'Bearer expired-token' }),
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should allow access and set user for valid token', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);
    const payload = { userId: '1', login: 'user', role: 'viewer' };
    jwtServiceMock.verifyAsync.mockResolvedValue(payload);

    const context = createMockContext({
      authorization: 'Bearer valid-token',
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(context.switchToHttp().getRequest().user).toEqual(payload);
  });

  describe('RolesGuard', () => {
    let guard: RolesGuard;
    let reflectorMock: any;

    const createMockContext = (user: any = null) =>
      ({
        switchToHttp: () => ({
          getRequest: () => ({ user }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      }) as any;

    beforeEach(() => {
      reflectorMock = {
        getAllAndOverride: vi.fn(),
      };

      guard = new RolesGuard(reflectorMock);
      vi.clearAllMocks();
    });

    it('should allow access when no @Roles() decorator', () => {
      reflectorMock.getAllAndOverride.mockReturnValue(undefined);

      expect(guard.canActivate(createMockContext())).toBe(true);
    });

    it('should allow access when roles array is empty', () => {
      reflectorMock.getAllAndOverride.mockReturnValue([]);

      expect(guard.canActivate(createMockContext())).toBe(true);
    });

    it('should throw ForbiddenException when no user', () => {
      reflectorMock.getAllAndOverride.mockReturnValue(['admin']);

      expect(() => guard.canActivate(createMockContext(null))).toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when role is insufficient', () => {
      reflectorMock.getAllAndOverride.mockReturnValue(['admin']);

      expect(() =>
        guard.canActivate(createMockContext({ role: 'viewer' })),
      ).toThrow(ForbiddenException);
    });

    it('should allow access when role matches', () => {
      reflectorMock.getAllAndOverride.mockReturnValue(['admin', 'editor']);

      const result = guard.canActivate(createMockContext({ role: 'editor' }));

      expect(result).toBe(true);
    });
  });
});
