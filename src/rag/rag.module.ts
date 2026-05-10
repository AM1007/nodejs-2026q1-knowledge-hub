import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QdrantService } from './services/qdrant.service';

@Module({
  imports: [ConfigModule],
  controllers: [],
  providers: [QdrantService],
  exports: [QdrantService],
})
export class RagModule {}
