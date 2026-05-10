import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QdrantService } from './services/qdrant.service';
import { GeminiEmbeddingsService } from './services/gemini-embeddings.service';

@Module({
  imports: [ConfigModule],
  controllers: [],
  providers: [QdrantService, GeminiEmbeddingsService],
  exports: [QdrantService, GeminiEmbeddingsService],
})
export class RagModule {}
