import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ArticleService } from './article.service';
import { prismaMock } from '../__tests__/prisma.mock';
import { NotFoundError, ValidationError } from '../common/errors';

describe('ArticleService', () => {
  let service: ArticleService;

  const mockArticle = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Test Article',
    content: 'Test content',
    status: 'DRAFT',
    authorId: null,
    categoryId: null,
    tags: [{ name: 'nodejs' }],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    service = new ArticleService(prismaMock as any);
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all articles', async () => {
      prismaMock.article.findMany.mockResolvedValue([mockArticle]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('draft');
      expect(result[0].tags).toEqual(['nodejs']);
    });

    it('should filter by status', async () => {
      prismaMock.article.findMany.mockResolvedValue([mockArticle]);

      await service.findAll({ status: 'draft' });

      expect(prismaMock.article.findMany).toHaveBeenCalledWith({
        where: { status: 'DRAFT' },
        include: { tags: true },
      });
    });

    it('should filter by categoryId', async () => {
      prismaMock.article.findMany.mockResolvedValue([]);

      await service.findAll({ categoryId: 'some-id' });

      expect(prismaMock.article.findMany).toHaveBeenCalledWith({
        where: { categoryId: 'some-id' },
        include: { tags: true },
      });
    });

    it('should filter by tag', async () => {
      prismaMock.article.findMany.mockResolvedValue([]);

      await service.findAll({ tag: 'nodejs' });

      expect(prismaMock.article.findMany).toHaveBeenCalledWith({
        where: { tags: { some: { name: 'nodejs' } } },
        include: { tags: true },
      });
    });
  });

  describe('findOne', () => {
    it('should throw ValidationError for invalid UUID', async () => {
      await expect(service.findOne('bad-id')).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError when article not found', async () => {
      prismaMock.article.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('550e8400-e29b-41d4-a716-446655440000'),
      ).rejects.toThrow(NotFoundError);
    });

    it('should return article with tags as string array', async () => {
      prismaMock.article.findUnique.mockResolvedValue(mockArticle);

      const result = await service.findOne(mockArticle.id);

      expect(result.tags).toEqual(['nodejs']);
      expect(result.status).toBe('draft');
    });
  });

  describe('create', () => {
    it('should create article with default status DRAFT', async () => {
      prismaMock.article.create.mockResolvedValue(mockArticle);

      const result = await service.create({
        title: 'Test',
        content: 'Content',
      });

      expect(prismaMock.article.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'DRAFT' }),
        }),
      );
      expect(result.status).toBe('draft');
    });

    it('should create article with tags', async () => {
      prismaMock.article.create.mockResolvedValue(mockArticle);

      await service.create({
        title: 'Test',
        content: 'Content',
        tags: ['nodejs', 'nestjs'],
      });

      expect(prismaMock.article.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tags: {
              connectOrCreate: expect.arrayContaining([
                expect.objectContaining({ where: { name: 'nodejs' } }),
              ]),
            },
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('should update article status', async () => {
      prismaMock.article.findUnique.mockResolvedValue(mockArticle);
      prismaMock.article.update.mockResolvedValue({
        ...mockArticle,
        status: 'PUBLISHED',
      });

      const result = await service.update(mockArticle.id, {
        status: 'published',
      });

      expect(result.status).toBe('published');
    });
  });

  describe('delete', () => {
    it('should throw ValidationError for invalid UUID', async () => {
      await expect(service.delete('bad-id')).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError when article not found', async () => {
      prismaMock.article.findUnique.mockResolvedValue(null);

      await expect(
        service.delete('550e8400-e29b-41d4-a716-446655440000'),
      ).rejects.toThrow(NotFoundError);
    });

    it('should delete article', async () => {
      prismaMock.article.findUnique.mockResolvedValue(mockArticle);
      prismaMock.article.delete.mockResolvedValue(mockArticle);

      await service.delete(mockArticle.id);

      expect(prismaMock.article.delete).toHaveBeenCalledWith({
        where: { id: mockArticle.id },
      });
    });
  });
});
