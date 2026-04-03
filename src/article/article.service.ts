import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { validate as isUUID } from 'uuid';
import { Article, ArticleStatus } from '../common';
import { CommentService } from '../comment/comment.service';

@Injectable()
export class ArticleService {
  private articles: Article[] = [];

  constructor(
    @Inject(forwardRef(() => CommentService))
    private readonly commentService: CommentService,
  ) {}

  findAll(filters?: {
    status?: string;
    categoryId?: string;
    tag?: string;
  }): Article[] {
    let result = this.articles;

    if (filters?.status) {
      result = result.filter((a) => a.status === filters.status);
    }
    if (filters?.categoryId) {
      result = result.filter((a) => a.categoryId === filters.categoryId);
    }
    if (filters?.tag) {
      result = result.filter((a) => a.tags.includes(filters.tag));
    }

    return result;
  }

  findOne(id: string): Article {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid articleId: not a valid UUID');
    }
    const article = this.articles.find((a) => a.id === id);
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    return article;
  }

  create(dto: {
    title: string;
    content: string;
    status?: ArticleStatus;
    authorId?: string | null;
    categoryId?: string | null;
    tags?: string[];
  }): Article {
    const now = Date.now();
    const article: Article = {
      id: randomUUID(),
      title: dto.title,
      content: dto.content,
      status: dto.status ?? ArticleStatus.DRAFT,
      authorId: dto.authorId ?? null,
      categoryId: dto.categoryId ?? null,
      tags: dto.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };
    this.articles.push(article);
    return article;
  }

  update(
    id: string,
    dto: {
      title?: string;
      content?: string;
      status?: ArticleStatus;
      categoryId?: string | null;
      tags?: string[];
    },
  ): Article {
    const article = this.findOne(id);

    if (dto.title !== undefined) article.title = dto.title;
    if (dto.content !== undefined) article.content = dto.content;
    if (dto.status !== undefined) article.status = dto.status;
    if (dto.categoryId !== undefined) article.categoryId = dto.categoryId;
    if (dto.tags !== undefined) article.tags = dto.tags;

    article.updatedAt = Date.now();
    return article;
  }

  delete(id: string): void {
    const article = this.findOne(id);
    this.commentService.deleteByArticleId(article.id);
    this.articles = this.articles.filter((a) => a.id !== article.id);
  }

  nullifyAuthor(userId: string): void {
    this.articles
      .filter((a) => a.authorId === userId)
      .forEach((a) => (a.authorId = null));
  }

  nullifyCategory(categoryId: string): void {
    this.articles
      .filter((a) => a.categoryId === categoryId)
      .forEach((a) => (a.categoryId = null));
  }

  findByArticleId(articleId: string): Article | null {
    return this.articles.find((a) => a.id === articleId) ?? null;
  }
}
