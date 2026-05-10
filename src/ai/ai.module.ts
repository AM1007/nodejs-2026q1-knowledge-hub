import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GeminiService } from './gemini.service';
import { CacheService } from './cache.service';
import { UsageService } from './usage.service';
import { ConversationService } from './conversation.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AiController],
  providers: [
    AiService,
    GeminiService,
    CacheService,
    UsageService,
    ConversationService,
  ],
  exports: [GeminiService],
})
export class AiModule {}
