import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { validate as isUUID } from 'uuid';
import { User, UserRole } from '../common';
import { ArticleService } from '../article/article.service';
import { CommentService } from '../comment/comment.service';

@Injectable()
export class UserService {
  private users: User[] = [];

  constructor(
    @Inject(forwardRef(() => ArticleService))
    private readonly articleService: ArticleService,
    @Inject(forwardRef(() => CommentService))
    private readonly commentService: CommentService,
  ) {}

  findAll(): User[] {
    return this.users;
  }

  findOne(id: string): User {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid userId: not a valid UUID');
    }
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  create(login: string, password: string, role?: UserRole): User {
    const now = Date.now();
    const user: User = {
      id: randomUUID(),
      login,
      password,
      role: role ?? UserRole.VIEWER,
      createdAt: now,
      updatedAt: now,
    };
    this.users.push(user);
    return user;
  }

  updatePassword(id: string, oldPassword: string, newPassword: string): User {
    const user = this.findOne(id);
    if (user.password !== oldPassword) {
      throw new ForbiddenException('Old password is wrong');
    }
    user.password = newPassword;
    user.updatedAt = Date.now();
    return user;
  }

  delete(id: string): void {
    const user = this.findOne(id);
    this.articleService.nullifyAuthor(user.id);
    this.commentService.deleteByAuthorId(user.id);
    this.users = this.users.filter((u) => u.id !== user.id);
  }
}
