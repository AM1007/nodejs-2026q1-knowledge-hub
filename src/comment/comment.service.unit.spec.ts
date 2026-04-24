import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommentService } from './comment.service';
import { prismaMock } from '../__tests__/prisma.mock';
import {
  NotFoundError,
  ValidationError,
  UnprocessableError,
} from '../common/errors';

describe('CommentService', () => {
  let service: CommentService;

  const mockComment = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    content: 'Great article!',
    articleId: '660e8400-e29b-41d4-a716-446655440000',
    authorId: null,
    createdAt: new Date(),
  };

  beforeEach(() => {
    service = new CommentService(prismaMock as any);
    vi.clearAllMocks();
  });

  describe('findOne', () => {
    it('should throw ValidationError for invalid UUID', async () => {
      await expect(service.findOne('bad-id')).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError when not found', async () => {
      prismaMock.comment.findUnique.mockResolvedValue(null);

      await expect(service.findOne(mockComment.id)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should return comment when found', async () => {
      prismaMock.comment.findUnique.mockResolvedValue(mockComment);

      const result = await service.findOne(mockComment.id);

      expect(result.content).toBe('Great article!');
    });
  });

  describe('create', () => {
    it('should throw ValidationError when article does not exist', async () => {
      prismaMock.article.findUnique.mockResolvedValue(null);

      await expect(
        service.create('Comment', 'non-existent-article-id'),
      ).rejects.toThrow(UnprocessableError);
    });

    it('should create comment when article exists', async () => {
      prismaMock.article.findUnique.mockResolvedValue({
        id: mockComment.articleId,
      });
      prismaMock.comment.create.mockResolvedValue(mockComment);

      const result = await service.create(
        'Great article!',
        mockComment.articleId,
      );

      expect(result.content).toBe('Great article!');
      expect(result.authorId).toBeNull();
    });
  });

  describe('delete', () => {
    it('should throw ValidationError for invalid UUID', async () => {
      await expect(service.delete('bad-id')).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError when not found', async () => {
      prismaMock.comment.findUnique.mockResolvedValue(null);

      await expect(service.delete(mockComment.id)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should delete comment', async () => {
      prismaMock.comment.findUnique.mockResolvedValue(mockComment);
      prismaMock.comment.delete.mockResolvedValue(mockComment);

      await service.delete(mockComment.id);

      expect(prismaMock.comment.delete).toHaveBeenCalledWith({
        where: { id: mockComment.id },
      });
    });
  });

  describe('findByArticleId', () => {
    it('should return comments for article', async () => {
      prismaMock.comment.findMany.mockResolvedValue([mockComment]);

      const result = await service.findByArticleId(mockComment.articleId);

      expect(result).toHaveLength(1);
    });
  });
});
