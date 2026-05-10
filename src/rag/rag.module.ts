import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RagController } from './rag.controller';
import { ChunkerService } from './services/chunker.service';
import { GeminiEmbeddingsService } from './services/gemini-embeddings.service';
import { QdrantService } from './services/qdrant.service';
import { RagService } from './services/rag.service';

@Module({
  imports: [ConfigModule],
  controllers: [RagController],
  providers: [
    QdrantService,
    GeminiEmbeddingsService,
    ChunkerService,
    RagService,
  ],
  exports: [QdrantService, GeminiEmbeddingsService, ChunkerService, RagService],
})
export class RagModule {}
