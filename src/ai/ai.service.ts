import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from './gemini.service';
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

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
  ) {}

  async summarize(articleId: string, dto: SummarizeArticleDto) {
    const article = await this.findArticleOrThrow(articleId);

    const prompt = buildSummarizePrompt(article.content, dto.maxLength);
    const summary = await this.gemini.generate(prompt);

    return {
      articleId,
      summary,
      originalLength: article.content.length,
      summaryLength: summary.length,
    };
  }

  async translate(articleId: string, dto: TranslateArticleDto) {
    const article = await this.findArticleOrThrow(articleId);

    const prompt = buildTranslatePrompt(
      article.content,
      dto.targetLanguage,
      dto.sourceLanguage,
    );
    const translatedText = await this.gemini.generate(prompt);

    return {
      articleId,
      translatedText,
      detectedLanguage: dto.sourceLanguage ?? 'auto',
    };
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
