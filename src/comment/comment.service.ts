import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { validate as isUUID } from 'uuid';
import { Comment } from '../common';
import { ArticleService } from '../article/article.service';

@Injectable()
export class CommentService {
  private comments: Comment[] = [];

  constructor(
    @Inject(forwardRef(() => ArticleService))
    private readonly articleService: ArticleService,
  ) {}

  findByArticleId(articleId: string): Comment[] {
    return this.comments.filter((c) => c.articleId === articleId);
  }

  findOne(id: string): Comment {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid commentId: not a valid UUID');
    }
    const comment = this.comments.find((c) => c.id === id);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    return comment;
  }

  create(
    content: string,
    articleId: string,
    authorId?: string | null,
  ): Comment {
    const article = this.articleService.findByArticleId(articleId);
    if (!article) {
      throw new UnprocessableEntityException(
        'Article with given articleId does not exist',
      );
    }

    const comment: Comment = {
      id: randomUUID(),
      content,
      articleId,
      authorId: authorId ?? null,
      createdAt: Date.now(),
    };
    this.comments.push(comment);
    return comment;
  }

  delete(id: string): void {
    const comment = this.findOne(id);
    this.comments = this.comments.filter((c) => c.id !== comment.id);
  }

  deleteByArticleId(articleId: string): void {
    this.comments = this.comments.filter((c) => c.articleId !== articleId);
  }

  deleteByAuthorId(authorId: string): void {
    this.comments = this.comments.filter((c) => c.authorId !== authorId);
  }
}
