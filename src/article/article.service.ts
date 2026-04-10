import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { validate as isUUID } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { ArticleStatus } from '@prisma/client';

@Injectable()
export class ArticleService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters?: {
    status?: string;
    categoryId?: string;
    tag?: string;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status.toUpperCase();
    }
    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }
    if (filters?.tag) {
      where.tags = { some: { name: filters.tag } };
    }

    const articles = await this.prisma.article.findMany({
      where,
      include: { tags: true },
    });

    return articles.map(this.toResponse);
  }

  async findOne(id: string) {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid articleId: not a valid UUID');
    }
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: { tags: true },
    });
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    return this.toResponse(article);
  }

  async create(dto: {
    title: string;
    content: string;
    status?: string;
    authorId?: string | null;
    categoryId?: string | null;
    tags?: string[];
  }) {
    const article = await this.prisma.article.create({
      data: {
        title: dto.title,
        content: dto.content,
        status: dto.status
          ? (dto.status.toUpperCase() as ArticleStatus)
          : ArticleStatus.DRAFT,
        authorId: dto.authorId ?? null,
        categoryId: dto.categoryId ?? null,
        tags: dto.tags?.length
          ? {
              connectOrCreate: dto.tags.map((name) => ({
                where: { name },
                create: { name },
              })),
            }
          : undefined,
      },
      include: { tags: true },
    });

    return this.toResponse(article);
  }

  async update(
    id: string,
    dto: {
      title?: string;
      content?: string;
      status?: string;
      categoryId?: string | null;
      tags?: string[];
    },
  ) {
    const existing = await this.findOne(id);

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.status !== undefined)
      data.status = dto.status.toUpperCase() as ArticleStatus;
    if (dto.categoryId !== undefined) data.categoryId = dto.categoryId;
    if (dto.tags !== undefined) {
      data.tags = {
        set: [],
        connectOrCreate: dto.tags.map((name) => ({
          where: { name },
          create: { name },
        })),
      };
    }

    const article = await this.prisma.article.update({
      where: { id },
      data,
      include: { tags: true },
    });

    return this.toResponse(article);
  }

  async delete(id: string) {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid articleId: not a valid UUID');
    }
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    await this.prisma.article.delete({ where: { id } });
  }

  private toResponse(article: any) {
    return {
      id: article.id,
      title: article.title,
      content: article.content,
      status: article.status.toLowerCase(),
      authorId: article.authorId,
      categoryId: article.categoryId,
      tags: article.tags ? article.tags.map((t: any) => t.name) : [],
      createdAt: article.createdAt.getTime(),
      updatedAt: article.updatedAt.getTime(),
    };
  }
}
