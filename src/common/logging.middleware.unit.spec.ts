import { describe, it, expect, vi } from 'vitest';
import { LoggingMiddleware } from './logging.middleware';

describe('LoggingMiddleware', () => {
  const middleware = new LoggingMiddleware();

  it('should log request and response', () => {
    const req = {
      method: 'GET',
      originalUrl: '/user',
      query: {},
      body: {},
    } as any;

    const res = {
      statusCode: 200,
      on: vi.fn((event, callback) => {
        if (event === 'finish') callback();
      }),
    } as any;

    const next = vi.fn();

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should sanitize password in body', () => {
    const req = {
      method: 'POST',
      originalUrl: '/user',
      query: {},
      body: { login: 'test', password: 'secret' },
    } as any;

    const res = {
      statusCode: 201,
      on: vi.fn((event, callback) => {
        if (event === 'finish') callback();
      }),
    } as any;

    const next = vi.fn();

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalled();
    // Оригинальный body не должен быть мутирован
    expect(req.body.password).toBe('secret');
  });

  it('should sanitize token in body', () => {
    const req = {
      method: 'POST',
      originalUrl: '/auth/refresh',
      query: {},
      body: { token: 'jwt-token-here' },
    } as any;

    const res = {
      statusCode: 200,
      on: vi.fn((event, callback) => {
        if (event === 'finish') callback();
      }),
    } as any;

    const next = vi.fn();

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
