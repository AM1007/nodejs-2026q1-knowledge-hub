import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticleDto, UpdateArticleDto } from './dto';
import { applyPaginationAndSort } from '../common';
import { ApiQuery } from '@nestjs/swagger';
import { Roles } from '../auth/decorators';

@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'tag', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'order', required: false })
  async findAll(
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
    @Query('tag') tag?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: string,
  ) {
    const articles = await this.articleService.findAll({
      status,
      categoryId,
      tag,
    });
    return applyPaginationAndSort(articles, { page, limit, sortBy, order });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.articleService.findOne(id);
  }

  @Post()
  @Roles('admin', 'editor')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateArticleDto) {
    return this.articleService.create(dto);
  }

  @Put(':id')
  @Roles('admin', 'editor')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateArticleDto,
    @Req() req: any,
  ) {
    const user = req.user;

    if (user.role === 'editor') {
      const article = await this.articleService.findOne(id);
      if (article.authorId !== user.userId) {
        throw new ForbiddenException("Cannot update other user's article");
      }
    }

    return this.articleService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.articleService.delete(id);
  }
}
