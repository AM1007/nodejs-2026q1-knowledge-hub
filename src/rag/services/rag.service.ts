import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { v5 as uuidv5 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { ChunkerService } from './chunker.service';
import { GeminiEmbeddingsService } from './gemini-embeddings.service';
import { QdrantService } from './qdrant.service';
import { QdrantPoint } from '../interfaces/qdrant.interfaces';

const RAG_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

export interface IndexArticleResult {
  articleId: string;
  chunksIndexed: number;
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chunker: ChunkerService,
    private readonly embeddings: GeminiEmbeddingsService,
    private readonly qdrant: QdrantService,
  ) {}

  async indexArticle(articleId: string): Promise<IndexArticleResult> {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      select: {
        id: true,
        title: true,
        content: true,
        status: true,
        authorId: true,
        categoryId: true,
        updatedAt: true,
      },
    });

    if (!article) {
      throw new NotFoundException(`Article ${articleId} not found`);
    }

    await this.qdrant.deletePointsByArticleId(articleId);

    const chunks = this.chunker.chunk(article.content);
    if (chunks.length === 0) {
      this.logger.warn(
        `Article ${articleId} produced 0 chunks (empty content)`,
      );
      return { articleId, chunksIndexed: 0 };
    }

    const points: QdrantPoint[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const text = chunks[i];
      const vector = await this.embeddings.embed(text, 'RETRIEVAL_DOCUMENT');
      points.push({
        id: uuidv5(`${articleId}:${i}`, RAG_NAMESPACE),
        vector,
        payload: {
          articleId: article.id,
          chunkIndex: i,
          text,
          status: article.status,
          authorId: article.authorId,
          categoryId: article.categoryId,
          updatedAt: article.updatedAt.toISOString(),
          title: article.title,
        },
      });
    }

    await this.qdrant.upsertPoints(points);

    this.logger.log(`Indexed article ${articleId}: ${chunks.length} chunks`);

    return { articleId, chunksIndexed: chunks.length };
  }
}
