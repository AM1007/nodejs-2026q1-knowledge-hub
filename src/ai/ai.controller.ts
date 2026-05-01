import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { AiService } from './ai.service';
import {
  AnalyzeArticleDto,
  SummarizeArticleDto,
  TranslateArticleDto,
} from './dto';

const AI_RATE_LIMIT_RPM = Number(process.env.AI_RATE_LIMIT_RPM ?? 20);

@Controller('ai')
@Throttle({ default: { limit: AI_RATE_LIMIT_RPM, ttl: 60_000 } })
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Public()
  @Get('health')
  getHealth() {
    return { status: 'ok' };
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('articles/:articleId/summarize')
  summarize(
    @Param('articleId') articleId: string,
    @Body() dto: SummarizeArticleDto,
  ) {
    return this.aiService.summarize(articleId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('articles/:articleId/translate')
  translate(
    @Param('articleId') articleId: string,
    @Body() dto: TranslateArticleDto,
  ) {
    return this.aiService.translate(articleId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('articles/:articleId/analyze')
  analyze(
    @Param('articleId') articleId: string,
    @Body() dto: AnalyzeArticleDto,
  ) {
    return this.aiService.analyze(articleId, dto);
  }
}
