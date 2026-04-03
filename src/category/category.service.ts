import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { validate as isUUID } from 'uuid';
import { Category } from '../common';
import { ArticleService } from '../article/article.service';

@Injectable()
export class CategoryService {
  private categories: Category[] = [];

  constructor(
    @Inject(forwardRef(() => ArticleService))
    private readonly articleService: ArticleService,
  ) {}

  findAll(): Category[] {
    return this.categories;
  }

  findOne(id: string): Category {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid categoryId: not a valid UUID');
    }
    const category = this.categories.find((c) => c.id === id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  create(name: string, description: string): Category {
    const category: Category = {
      id: randomUUID(),
      name,
      description,
    };
    this.categories.push(category);
    return category;
  }

  update(id: string, name: string, description: string): Category {
    const category = this.findOne(id);
    category.name = name;
    category.description = description;
    return category;
  }

  delete(id: string): void {
    const category = this.findOne(id);
    this.articleService.nullifyCategory(category.id);
    this.categories = this.categories.filter((c) => c.id !== category.id);
  }
}
