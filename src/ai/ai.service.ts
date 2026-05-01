import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from './gemini.service';
import { CacheService } from './cache.service';
import {
  buildSummarizePrompt,
  buildTranslatePrompt,
  buildAnalyzePrompt,
} from './prompts';
import {
  SummarizeArticleDto,
  TranslateArticleDto,
  AnalyzeArticleDto,
} from './dto';

interface AnalyzeResult {
  analysis: string;
  suggestions: string[];
  severity: 'info' | 'warning' | 'error';
}

export interface SummarizeResult {
  articleId: string;
  summary: string;
  originalLength: number;
  summaryLength: number;
}

export interface TranslateResult {
  articleId: string;
  translatedText: string;
  detectedLanguage: string;
}

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
    private readonly cache: CacheService,
  ) {}

  async summarize(
    articleId: string,
    dto: SummarizeArticleDto,
  ): Promise<SummarizeResult> {
    const article = await this.findArticleOrThrow(articleId);

    const cacheKey = this.buildSummarizeKey(article.id, article.updatedAt, dto);
    const cached = this.cache.get<SummarizeResult>(cacheKey);
    if (cached) return cached;

    const prompt = buildSummarizePrompt(article.content, dto.maxLength);
    const summary = await this.gemini.generate(prompt);

    const result: SummarizeResult = {
      articleId,
      summary,
      originalLength: article.content.length,
      summaryLength: summary.length,
    };

    this.cache.set(cacheKey, result);
    return result;
  }

  async translate(
    articleId: string,
    dto: TranslateArticleDto,
  ): Promise<TranslateResult> {
    const article = await this.findArticleOrThrow(articleId);

    const cacheKey = this.buildTranslateKey(article.id, article.updatedAt, dto);
    const cached = this.cache.get<TranslateResult>(cacheKey);
    if (cached) return cached;

    const prompt = buildTranslatePrompt(
      article.content,
      dto.targetLanguage,
      dto.sourceLanguage,
    );
    const translatedText = await this.gemini.generate(prompt);

    const result: TranslateResult = {
      articleId,
      translatedText,
      detectedLanguage: dto.sourceLanguage ?? 'auto',
    };

    this.cache.set(cacheKey, result);
    return result;
  }

  async analyze(articleId: string, dto: AnalyzeArticleDto) {
    const article = await this.findArticleOrThrow(articleId);

    const prompt = buildAnalyzePrompt(article.content, dto.task);
    const raw = await this.gemini.generate(prompt);

    const parsed = this.tryParseAnalyzeResult(raw);

    return {
      articleId,
      ...parsed,
    };
  }

  private buildSummarizeKey(
    articleId: string,
    updatedAt: Date,
    dto: SummarizeArticleDto,
  ): string {
    const length = dto.maxLength ?? 'medium';
    return `summarize:${articleId}:${updatedAt.getTime()}:${length}`;
  }

  private buildTranslateKey(
    articleId: string,
    updatedAt: Date,
    dto: TranslateArticleDto,
  ): string {
    const source = dto.sourceLanguage ?? '';
    return `translate:${articleId}:${updatedAt.getTime()}:${dto.targetLanguage}:${source}`;
  }

  private async findArticleOrThrow(articleId: string) {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      throw new NotFoundException(`Article with id ${articleId} not found`);
    }

    return article;
  }

  private tryParseAnalyzeResult(raw: string): AnalyzeResult {
    const cleaned = raw
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```\s*$/i, '');

    try {
      const parsed = JSON.parse(cleaned);
      return {
        analysis: parsed.analysis ?? '',
        suggestions: Array.isArray(parsed.suggestions)
          ? parsed.suggestions
          : [],
        severity: ['info', 'warning', 'error'].includes(parsed.severity)
          ? parsed.severity
          : 'info',
      };
    } catch {
      return {
        analysis: raw,
        suggestions: [],
        severity: 'info',
      };
    }
  }
}
