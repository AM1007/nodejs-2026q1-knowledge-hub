import { Injectable } from '@nestjs/common';
import {
  NotFoundError,
  ValidationError,
  UnprocessableError,
} from '../common/errors';
import { validate as isUUID } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

  async findByArticleId(articleId: string) {
    const comments = await this.prisma.comment.findMany({
      where: { articleId },
    });
    return comments.map(this.toResponse);
  }

  async findOne(id: string) {
    if (!isUUID(id)) {
      throw new ValidationError('Invalid commentId: not a valid UUID');
    }
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      throw new NotFoundError('Comment not found');
    }
    return this.toResponse(comment);
  }

  async create(content: string, articleId: string, authorId?: string | null) {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
    });
    if (!article) {
      throw new UnprocessableError(
        'Article with given articleId does not exist',
      );
    }

    const comment = await this.prisma.comment.create({
      data: {
        content,
        articleId,
        authorId: authorId ?? null,
      },
    });
    return this.toResponse(comment);
  }

  async delete(id: string) {
    if (!isUUID(id)) {
      throw new ValidationError('Invalid commentId: not a valid UUID');
    }
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      throw new NotFoundError('Comment not found');
    }
    await this.prisma.comment.delete({ where: { id } });
  }

  private toResponse(comment: any) {
    return {
      id: comment.id,
      content: comment.content,
      articleId: comment.articleId,
      authorId: comment.authorId,
      createdAt: comment.createdAt.getTime(),
    };
  }
}
