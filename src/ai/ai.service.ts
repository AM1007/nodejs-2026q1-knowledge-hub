import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from './gemini.service';
import { CacheService } from './cache.service';
import { UsageService } from './usage.service';
import { validateAnalyzeResponse } from './schemas/analyze-response.schema';
import {
  buildSummarizePrompt,
  buildTranslatePrompt,
  buildAnalyzePrompt,
} from './prompts';
import {
  SummarizeArticleDto,
  TranslateArticleDto,
  AnalyzeArticleDto,
  GenerateDto,
} from './dto';
import { ConversationService } from './conversation.service';

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
    private readonly usage: UsageService,
    private readonly conversation: ConversationService,
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
    const startedAt = Date.now();
    const { text: summary, usage } = await this.gemini.generate(prompt);
    this.usage.recordRequest('summarize', usage, Date.now() - startedAt);

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
    const startedAt = Date.now();
    const { text: translatedText, usage } = await this.gemini.generate(prompt);
    this.usage.recordRequest('translate', usage, Date.now() - startedAt);

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
    const startedAt = Date.now();
    const { text: raw, usage } = await this.gemini.generate(prompt);
    this.usage.recordRequest('analyze', usage, Date.now() - startedAt);

    const parsed = this.tryParseAnalyzeResult(raw);

    return {
      articleId,
      ...parsed,
    };
  }

  async generate(
    dto: GenerateDto,
  ): Promise<{ text: string; sessionId?: string }> {
    const startedAt = Date.now();

    if (dto.sessionId) {
      const history = this.conversation.getHistory(dto.sessionId);
      const messages = [
        ...history,
        { role: 'user' as const, text: dto.prompt },
      ];

      const { text, usage } = await this.gemini.generateWithHistory(messages);
      this.usage.recordRequest('generate', usage, Date.now() - startedAt);

      this.conversation.appendMessages(
        dto.sessionId,
        { role: 'user', text: dto.prompt },
        { role: 'model', text },
      );

      return { text, sessionId: dto.sessionId };
    }

    const { text, usage } = await this.gemini.generate(dto.prompt);
    this.usage.recordRequest('generate', usage, Date.now() - startedAt);

    return { text };
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

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return this.fallbackAnalyzeResult(raw);
    }

    const validated = validateAnalyzeResponse(parsed);
    if (!validated) {
      return this.fallbackAnalyzeResult(raw);
    }

    return {
      analysis: validated.analysis,
      suggestions: validated.suggestions,
      severity: validated.severity,
    };
  }

  private fallbackAnalyzeResult(raw: string): AnalyzeResult {
    return {
      analysis: raw,
      suggestions: [],
      severity: 'info',
    };
  }
}
