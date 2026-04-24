import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CategoryService } from './category.service';
import { prismaMock } from '../__tests__/prisma.mock';
import { NotFoundError, ValidationError } from '../common/errors';

describe('CategoryService', () => {
  let service: CategoryService;

  const mockCategory = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Tech',
    description: 'Technology articles',
  };

  beforeEach(() => {
    service = new CategoryService(prismaMock as any);
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      prismaMock.category.findMany.mockResolvedValue([mockCategory]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Tech');
    });
  });

  describe('findOne', () => {
    it('should throw ValidationError for invalid UUID', async () => {
      await expect(service.findOne('bad-id')).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError when not found', async () => {
      prismaMock.category.findUnique.mockResolvedValue(null);

      await expect(service.findOne(mockCategory.id)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should return category when found', async () => {
      prismaMock.category.findUnique.mockResolvedValue(mockCategory);

      const result = await service.findOne(mockCategory.id);

      expect(result.name).toBe('Tech');
    });
  });

  describe('create', () => {
    it('should create category', async () => {
      prismaMock.category.create.mockResolvedValue(mockCategory);

      const result = await service.create('Tech', 'Technology articles');

      expect(prismaMock.category.create).toHaveBeenCalledWith({
        data: { name: 'Tech', description: 'Technology articles' },
      });
      expect(result.name).toBe('Tech');
    });
  });

  describe('delete', () => {
    it('should throw ValidationError for invalid UUID', async () => {
      await expect(service.delete('bad-id')).rejects.toThrow(ValidationError);
    });

    it('should delete category and nullify articles', async () => {
      prismaMock.category.findUnique.mockResolvedValue(mockCategory);
      prismaMock.$transaction.mockResolvedValue(undefined);

      await service.delete(mockCategory.id);

      expect(prismaMock.$transaction).toHaveBeenCalled();
    });
  });
});
