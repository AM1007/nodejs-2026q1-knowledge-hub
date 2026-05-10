import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiModule } from '../ai/ai.module';
import { RagController } from './rag.controller';
import { ChunkerService } from './services/chunker.service';
import { GeminiEmbeddingsService } from './services/gemini-embeddings.service';
import { QdrantService } from './services/qdrant.service';
import { RagService } from './services/rag.service';
import { RagConversationService } from './services/rag-conversation.service';

@Module({
  imports: [ConfigModule, AiModule],
  controllers: [RagController],
  providers: [
    QdrantService,
    GeminiEmbeddingsService,
    ChunkerService,
    RagConversationService,
    RagService,
  ],
  exports: [QdrantService, GeminiEmbeddingsService, ChunkerService, RagService],
})
export class RagModule {}
