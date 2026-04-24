import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import 'reflect-metadata';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { CreateArticleDto } from '../article/dto/create-article.dto';

describe('CreateUserDto', () => {
  it('should pass with valid data', async () => {
    const dto = plainToInstance(CreateUserDto, {
      login: 'testuser',
      password: 'secret123',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail when login is missing', async () => {
    const dto = plainToInstance(CreateUserDto, {
      password: 'secret123',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'login')).toBe(true);
  });

  it('should fail when password is missing', async () => {
    const dto = plainToInstance(CreateUserDto, {
      login: 'testuser',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('should fail with invalid role enum', async () => {
    const dto = plainToInstance(CreateUserDto, {
      login: 'testuser',
      password: 'secret123',
      role: 'superadmin',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'role')).toBe(true);
  });

  it('should pass with valid role enum', async () => {
    const dto = plainToInstance(CreateUserDto, {
      login: 'testuser',
      password: 'secret123',
      role: 'admin',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});

describe('CreateArticleDto', () => {
  it('should pass with valid data', async () => {
    const dto = plainToInstance(CreateArticleDto, {
      title: 'Test',
      content: 'Content',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail when title is missing', async () => {
    const dto = plainToInstance(CreateArticleDto, {
      content: 'Content',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'title')).toBe(true);
  });

  it('should fail when content is missing', async () => {
    const dto = plainToInstance(CreateArticleDto, {
      title: 'Test',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'content')).toBe(true);
  });

  it('should fail with invalid status enum', async () => {
    const dto = plainToInstance(CreateArticleDto, {
      title: 'Test',
      content: 'Content',
      status: 'invalid_status',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'status')).toBe(true);
  });

  it('should pass with valid status enum', async () => {
    const dto = plainToInstance(CreateArticleDto, {
      title: 'Test',
      content: 'Content',
      status: 'draft',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
