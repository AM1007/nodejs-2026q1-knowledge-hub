import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeminiUsage } from './usage.service';
import { ConversationMessage } from './conversation.service';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
  usageMetadata?: GeminiUsage;
}

export interface GeminiResult {
  text: string;
  usage?: GeminiUsage;
}

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1_000;

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    this.apiKey = apiKey;
    this.baseUrl = this.configService.get<string>(
      'GEMINI_API_BASE_URL',
      'https://generativelanguage.googleapis.com',
    );
    this.model = this.configService.get<string>(
      'GEMINI_MODEL',
      'gemini-2.0-flash',
    );
  }

  async generate(prompt: string): Promise<GeminiResult> {
    return this.generateWithHistory([{ role: 'user', text: prompt }]);
  }

  async generateWithHistory(
    messages: ConversationMessage[],
  ): Promise<GeminiResult> {
    const url = `${this.baseUrl}/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const body = JSON.stringify({
      contents: messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      })),
    });

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await this.callGemini(url, body);

        if (response.ok) {
          const data = (await response.json()) as GeminiResponse;
          return {
            text: data.candidates[0].content.parts[0].text,
            usage: data.usageMetadata,
          };
        }

        if (this.isAuthError(response.status)) {
          this.logger.error(`Gemini auth error: ${response.status}`);
          throw new InternalServerErrorException('AI service misconfigured');
        }

        if (this.isRetryable(response.status)) {
          this.logger.warn(
            `Gemini returned ${response.status}, attempt ${attempt + 1}/${MAX_RETRIES}`,
          );
          if (attempt < MAX_RETRIES - 1) {
            await this.delay(BASE_RETRY_DELAY_MS * 2 ** attempt);
            continue;
          }
        }

        throw new ServiceUnavailableException(
          `Gemini API error: ${response.status}`,
        );
      } catch (error) {
        if (error instanceof InternalServerErrorException) throw error;
        if (error instanceof ServiceUnavailableException) throw error;

        if (this.isNetworkError(error)) {
          this.logger.warn(
            `Gemini network error, attempt ${attempt + 1}/${MAX_RETRIES}: ${(error as Error).message}`,
          );
          if (attempt < MAX_RETRIES - 1) {
            await this.delay(BASE_RETRY_DELAY_MS * 2 ** attempt);
            continue;
          }
          throw new ServiceUnavailableException('Gemini API unreachable');
        }

        this.logger.error('Unexpected Gemini error', error as Error);
        throw new ServiceUnavailableException('Gemini API error');
      }
    }

    throw new ServiceUnavailableException('Gemini API unreachable');
  }

  private async callGemini(url: string, body: string): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      return await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private isAuthError(status: number): boolean {
    return status === 401 || status === 403;
  }

  private isRetryable(status: number): boolean {
    return status === 429 || status >= 500;
  }

  private isNetworkError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    return (
      error.name === 'AbortError' ||
      error.name === 'TypeError' ||
      error.message.includes('fetch failed')
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
