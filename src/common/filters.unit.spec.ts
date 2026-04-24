import 'reflect-metadata';
import { describe, it, expect, vi } from 'vitest';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { HttpException, HttpStatus } from '@nestjs/common';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  UnauthorizedError,
} from './errors';

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  const createMockHost = () => {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const response = { status };

    return {
      switchToHttp: () => ({
        getResponse: () => response,
      }),
      host: { response, json, status },
    };
  };

  it('should handle NotFoundError with 404', () => {
    const { host, ...mockHost } = createMockHost();

    filter.catch(new NotFoundError('User not found'), mockHost as any);

    expect(host.status).toHaveBeenCalledWith(404);
    expect(host.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: 'User not found',
      }),
    );
  });

  it('should handle ValidationError with 400', () => {
    const { host, ...mockHost } = createMockHost();

    filter.catch(new ValidationError('Invalid input'), mockHost as any);

    expect(host.status).toHaveBeenCalledWith(400);
  });

  it('should handle UnauthorizedError with 401', () => {
    const { host, ...mockHost } = createMockHost();

    filter.catch(new UnauthorizedError(), mockHost as any);

    expect(host.status).toHaveBeenCalledWith(401);
  });

  it('should handle ForbiddenError with 403', () => {
    const { host, ...mockHost } = createMockHost();

    filter.catch(new ForbiddenError(), mockHost as any);

    expect(host.status).toHaveBeenCalledWith(403);
  });

  it('should handle NestJS HttpException', () => {
    const { host, ...mockHost } = createMockHost();

    filter.catch(
      new HttpException('Conflict', HttpStatus.CONFLICT),
      mockHost as any,
    );

    expect(host.status).toHaveBeenCalledWith(409);
  });

  it('should default to 500 for unknown errors', () => {
    const { host, ...mockHost } = createMockHost();

    filter.catch(new Error('Something broke'), mockHost as any);

    expect(host.status).toHaveBeenCalledWith(500);
    expect(host.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
      }),
    );
  });
});
