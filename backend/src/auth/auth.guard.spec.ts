import { AuthGuard } from './auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';


describe('AuthGuard', () => {
  let guard: AuthGuard;

  const mockJwtService = {
    verifyAsync: jest.fn(),
  } as any;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('secret'),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new AuthGuard(mockJwtService, mockConfigService);
  });

  const createMockContext = (headers = {}) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          headers,
        }),
      }),
    } as any);

  // ================= NO TOKEN =================
  it('should throw if no token is provided', async () => {
    const context = createMockContext();

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  // ================= INVALID TOKEN =================
  it('should throw if token is invalid', async () => {
    const context = createMockContext({
      authorization: 'Bearer invalid-token',
    });

    mockJwtService.verifyAsync.mockRejectedValue(new Error());

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  // ================= VALID TOKEN =================
  it('should return true and attach user if token is valid', async () => {
    const payload = { sub: 1, email: 'test@test.com' };

    const request: any = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    };

    const context: any = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    };

    mockJwtService.verifyAsync.mockResolvedValue(payload);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user).toEqual(payload);
  });

  // ================= WRONG FORMAT =================
  it('should throw if authorization header is malformed', async () => {
    const context = createMockContext({
      authorization: 'Basic something',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
