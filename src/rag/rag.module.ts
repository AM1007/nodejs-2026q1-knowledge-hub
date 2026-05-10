import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QdrantService } from './services/qdrant.service';
import { GeminiEmbeddingsService } from './services/gemini-embeddings.service';
import { ChunkerService } from './services/chunker.service';
import { RagService } from './services/rag.service';

@Module({
  imports: [ConfigModule],
  controllers: [],
  providers: [
    QdrantService,
    GeminiEmbeddingsService,
    ChunkerService,
    RagService,
  ],
  exports: [QdrantService, GeminiEmbeddingsService, ChunkerService, RagService],
})
export class RagModule {}
