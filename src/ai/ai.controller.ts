import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { AiService } from './ai.service';
import {
  AnalyzeArticleDto,
  SummarizeArticleDto,
  TranslateArticleDto,
} from './dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Public()
  @Get('health')
  getHealth() {
    return { status: 'ok' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('articles/:articleId/summarize')
  summarize(
    @Param('articleId') articleId: string,
    @Body() dto: SummarizeArticleDto,
  ) {
    return this.aiService.summarize(articleId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('articles/:articleId/translate')
  translate(
    @Param('articleId') articleId: string,
    @Body() dto: TranslateArticleDto,
  ) {
    return this.aiService.translate(articleId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('articles/:articleId/analyze')
  analyze(
    @Param('articleId') articleId: string,
    @Body() dto: AnalyzeArticleDto,
  ) {
    return this.aiService.analyze(articleId, dto);
  }
}
