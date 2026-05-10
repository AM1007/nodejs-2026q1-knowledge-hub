import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GeminiEmbedRequest,
  GeminiEmbedResponse,
  GeminiTaskType,
} from '../interfaces/gemini-embeddings.interfaces';

@Injectable()
export class GeminiEmbeddingsService {
  private readonly logger = new Logger(GeminiEmbeddingsService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly dimensions: number;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.getOrThrow<string>('GEMINI_API_KEY');
    this.baseUrl = this.config
      .getOrThrow<string>('GEMINI_API_BASE_URL')
      .replace(/\/$/, '');
    this.model = this.config.getOrThrow<string>('GEMINI_EMBEDDING_MODEL');
    this.dimensions = parseInt(
      this.config.getOrThrow<string>('GEMINI_EMBEDDING_DIMENSIONS'),
      10,
    );

    if (Number.isNaN(this.dimensions) || this.dimensions <= 0) {
      throw new Error('GEMINI_EMBEDDING_DIMENSIONS must be a positive integer');
    }
  }

  async embed(text: string, taskType: GeminiTaskType): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new InternalServerErrorException('Cannot embed empty text');
    }

    const url = `${this.baseUrl}/v1beta/models/${this.model}:embedContent`;
    const body: GeminiEmbedRequest = {
      content: { parts: [{ text }] },
      outputDimensionality: this.dimensions,
      taskType,
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error';
      this.logger.error(`Gemini embeddings request failed: ${message}`);
      throw new ServiceUnavailableException(
        'Gemini embeddings service unreachable',
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `Gemini embeddings ${response.status}: ${errorText.slice(0, 200)}`,
      );
      if (response.status === 401 || response.status === 403) {
        throw new InternalServerErrorException(
          'Gemini embeddings authentication failed',
        );
      }
      if (response.status === 429) {
        throw new ServiceUnavailableException(
          'Gemini embeddings rate limit exceeded',
        );
      }
      throw new ServiceUnavailableException(
        `Gemini embeddings error: ${response.status}`,
      );
    }

    const data = (await response.json()) as GeminiEmbedResponse;

    if (!data.embedding?.values || data.embedding.values.length === 0) {
      throw new InternalServerErrorException('Gemini returned empty embedding');
    }

    if (data.embedding.values.length !== this.dimensions) {
      throw new InternalServerErrorException(
        `Gemini returned ${data.embedding.values.length}-dim vector, expected ${this.dimensions}`,
      );
    }

    return data.embedding.values;
  }
}
