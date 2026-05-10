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
import { randomUUID } from 'node:crypto';
import { GeminiService } from '../../ai/gemini.service';
import { ConversationMessage } from '../../ai/conversation.service';
import { RagConversationService } from './rag-conversation.service';
import { buildRagPrompt } from '../prompts/rag.prompt';

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

export interface ChatOptions {
  question: string;
  conversationId?: string;
}

export interface ChatSource {
  articleId: string;
  articleTitle: string;
  relevantChunk: string;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
  conversationId: string;
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chunker: ChunkerService,
    private readonly embeddings: GeminiEmbeddingsService,
    private readonly qdrant: QdrantService,
    private readonly gemini: GeminiService,
    private readonly conversations: RagConversationService,
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

  async chat(options: ChatOptions): Promise<ChatResponse> {
    const conversationId = options.conversationId ?? randomUUID();

    const queryVector = await this.embeddings.embed(
      options.question,
      'RETRIEVAL_QUERY',
    );

    const points = await this.qdrant.search(queryVector, 5, undefined);

    const sources: ChatSource[] = points.map((p) => ({
      articleId: p.payload.articleId,
      articleTitle: p.payload.title,
      relevantChunk: p.payload.text,
    }));

    const contextChunks = points.map((p) => ({
      title: p.payload.title,
      text: p.payload.text,
    }));

    const promptText = buildRagPrompt({
      question: options.question,
      contextChunks,
    });

    const history = this.conversations.getHistory(conversationId);
    const messages: ConversationMessage[] = [
      ...history,
      { role: 'user', text: promptText },
    ];

    const result = await this.gemini.generateWithHistory(messages);

    this.conversations.appendMessages(
      conversationId,
      { role: 'user', text: options.question },
      { role: 'model', text: result.text },
    );

    this.logger.log(
      `Chat in conversation ${conversationId}: ${sources.length} sources used`,
    );

    return {
      answer: result.text,
      sources,
      conversationId,
    };
  }
}
