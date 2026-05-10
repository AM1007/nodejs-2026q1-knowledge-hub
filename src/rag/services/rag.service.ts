import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { v5 as uuidv5 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { ChunkerService } from './chunker.service';
import { GeminiEmbeddingsService } from './gemini-embeddings.service';
import { QdrantService } from './qdrant.service';
import {
  QdrantPoint,
  QdrantFilterCondition,
} from '../interfaces/qdrant.interfaces';

const RAG_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

export interface IndexArticleResult {
  articleId: string;
  chunksIndexed: number;
}

export interface IndexBatchOptions {
  onlyPublished?: boolean;
  articleIds?: string[];
}

export interface IndexBatchResult {
  indexedArticles: number;
  indexedChunks: number;
  vectorCollection: string;
}

export type ArticleStatusFilter = 'draft' | 'published' | 'archived';

export interface SearchOptions {
  query: string;
  limit?: number;
  articleStatus?: ArticleStatusFilter;
  categoryId?: string;
  tags?: string[];
}

export interface SearchResult {
  articleId: string;
  articleTitle: string;
  chunk: string;
  similarity: number;
}

export interface SearchResponse {
  results: SearchResult[];
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
        tags: {
          select: { name: true },
        },
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
          tags: article.tags.map((t) => t.name),
        },
      });
    }

    await this.qdrant.upsertPoints(points);

    this.logger.log(`Indexed article ${articleId}: ${chunks.length} chunks`);

    return { articleId, chunksIndexed: chunks.length };
  }

  async indexBatch(options: IndexBatchOptions): Promise<IndexBatchResult> {
    const onlyPublished = options.onlyPublished ?? true;

    const articles = await this.prisma.article.findMany({
      where: {
        ...(options.articleIds && options.articleIds.length > 0
          ? { id: { in: options.articleIds } }
          : {}),
        ...(onlyPublished ? { status: 'PUBLISHED' } : {}),
      },
      select: { id: true },
    });

    let indexedArticles = 0;
    let indexedChunks = 0;

    for (const article of articles) {
      const result = await this.indexArticle(article.id);
      if (result.chunksIndexed > 0) {
        indexedArticles += 1;
        indexedChunks += result.chunksIndexed;
      }
    }

    return {
      indexedArticles,
      indexedChunks,
      vectorCollection: this.qdrant.collectionName,
    };
  }

  async search(options: SearchOptions): Promise<SearchResponse> {
    const limit = Math.min(options.limit ?? 5, 20);
    const queryVector = await this.embeddings.embed(
      options.query,
      'RETRIEVAL_QUERY',
    );

    const must: QdrantFilterCondition[] = [];

    if (options.articleStatus) {
      must.push({
        key: 'status',
        match: { value: options.articleStatus.toUpperCase() },
      });
    }

    if (options.categoryId) {
      must.push({
        key: 'categoryId',
        match: { value: options.categoryId },
      });
    }

    if (options.tags && options.tags.length > 0) {
      must.push({
        key: 'tags',
        match: { any: options.tags },
      });
    }

    const filter = must.length > 0 ? { must } : undefined;
    const points = await this.qdrant.search(queryVector, limit, filter);

    return {
      results: points.map((point) => ({
        articleId: point.payload.articleId,
        articleTitle: point.payload.title,
        chunk: point.payload.text,
        similarity: point.score,
      })),
    };
  }
}
