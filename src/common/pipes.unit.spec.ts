import { describe, it, expect } from 'vitest';
import { ParseUUIDPipe, BadRequestException } from '@nestjs/common';

describe('ParseUUIDPipe', () => {
  const pipe = new ParseUUIDPipe();

  it('should pass valid UUID through', async () => {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';

    const result = await pipe.transform(validUuid, {
      type: 'param',
      metatype: String,
      data: 'id',
    });

    expect(result).toBe(validUuid);
  });

  it('should throw BadRequestException for invalid UUID', async () => {
    await expect(
      pipe.transform('not-a-uuid', {
        type: 'param',
        metatype: String,
        data: 'id',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException for empty string', async () => {
    await expect(
      pipe.transform('', { type: 'param', metatype: String, data: 'id' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException for partial UUID', async () => {
    await expect(
      pipe.transform('550e8400-e29b-41d4', {
        type: 'param',
        metatype: String,
        data: 'id',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
