import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  QdrantCollectionInfo,
  QdrantCreateCollectionRequest,
  QdrantOperationResponse,
} from '../interfaces/qdrant.interfaces';

@Injectable()
export class QdrantService implements OnModuleInit {
  private readonly logger = new Logger(QdrantService.name);
  private readonly baseUrl: string;
  private readonly collectionName: string;
  private readonly vectorSize: number;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config
      .getOrThrow<string>('RAG_VECTOR_DB_URL')
      .replace(/\/$/, '');
    this.collectionName = this.config.getOrThrow<string>(
      'RAG_VECTOR_COLLECTION',
    );
    this.vectorSize = parseInt(
      this.config.getOrThrow<string>('GEMINI_EMBEDDING_DIMENSIONS'),
      10,
    );

    if (Number.isNaN(this.vectorSize) || this.vectorSize <= 0) {
      throw new Error('GEMINI_EMBEDDING_DIMENSIONS must be a positive integer');
    }
  }

  async onModuleInit(): Promise<void> {
    await this.ensureCollectionExists();
  }

  private async ensureCollectionExists(): Promise<void> {
    const existing = await this.fetchCollectionInfo();

    if (existing) {
      const actualSize = existing.result.config.params.vectors.size;
      if (actualSize !== this.vectorSize) {
        throw new InternalServerErrorException(
          `Qdrant collection "${this.collectionName}" has vector size ${actualSize}, ` +
            `but app expects ${this.vectorSize}. Recreate the collection or fix config.`,
        );
      }
      this.logger.log(
        `Qdrant collection "${this.collectionName}" exists with ${existing.result.points_count} points`,
      );
      return;
    }

    await this.createCollection();
    this.logger.log(
      `Qdrant collection "${this.collectionName}" created (size=${this.vectorSize}, distance=Cosine)`,
    );
  }

  private async fetchCollectionInfo(): Promise<QdrantCollectionInfo | null> {
    const url = `${this.baseUrl}/collections/${this.collectionName}`;
    let response: Response;

    try {
      response = await fetch(url, { method: 'GET' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error';
      this.logger.error(`Qdrant unreachable at ${this.baseUrl}: ${message}`);
      throw new InternalServerErrorException(
        `Qdrant is not reachable at ${this.baseUrl}`,
      );
    }

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`Qdrant GET ${url} failed: ${response.status} ${text}`);
      throw new InternalServerErrorException(
        `Qdrant returned ${response.status} on collection check`,
      );
    }

    return (await response.json()) as QdrantCollectionInfo;
  }

  private async createCollection(): Promise<void> {
    const url = `${this.baseUrl}/collections/${this.collectionName}`;
    const body: QdrantCreateCollectionRequest = {
      vectors: { size: this.vectorSize, distance: 'Cosine' },
    };

    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`Qdrant PUT ${url} failed: ${response.status} ${text}`);
      throw new InternalServerErrorException(
        `Failed to create Qdrant collection: ${response.status}`,
      );
    }

    const data = (await response.json()) as QdrantOperationResponse;
    if (!data.result) {
      throw new InternalServerErrorException(
        'Qdrant create collection returned result=false',
      );
    }
  }
}
