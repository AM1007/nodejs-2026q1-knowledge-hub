import { Injectable } from '@nestjs/common';
import { CacheService } from './cache.service';

export type AiEndpoint = 'summarize' | 'translate' | 'analyze' | 'generate';

export interface GeminiUsage {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

export interface UsageStats {
  totalRequests: number;
  requestsByEndpoint: Record<AiEndpoint, number>;
  tokens: {
    totalPromptTokens: number;
    totalCandidatesTokens: number;
    totalTokens: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRatio: number;
  };
  latencyMs: {
    averageGeminiCall: number;
  };
}

@Injectable()
export class UsageService {
  private totalRequests = 0;
  private readonly requestsByEndpoint: Record<AiEndpoint, number> = {
    summarize: 0,
    translate: 0,
    analyze: 0,
    generate: 0,
  };
  private totalPromptTokens = 0;
  private totalCandidatesTokens = 0;
  private totalTokens = 0;
  private totalGeminiLatencyMs = 0;
  private geminiCallCount = 0;

  constructor(private readonly cache: CacheService) {}

  recordRequest(
    endpoint: AiEndpoint,
    usage?: GeminiUsage,
    latencyMs?: number,
  ): void {
    this.totalRequests += 1;
    this.requestsByEndpoint[endpoint] += 1;

    if (usage) {
      this.totalPromptTokens += usage.promptTokenCount ?? 0;
      this.totalCandidatesTokens += usage.candidatesTokenCount ?? 0;
      this.totalTokens += usage.totalTokenCount ?? 0;
    }

    if (typeof latencyMs === 'number') {
      this.totalGeminiLatencyMs += latencyMs;
      this.geminiCallCount += 1;
    }
  }

  getStats(): UsageStats {
    const averageGeminiCall =
      this.geminiCallCount === 0
        ? 0
        : Math.round(this.totalGeminiLatencyMs / this.geminiCallCount);

    return {
      totalRequests: this.totalRequests,
      requestsByEndpoint: { ...this.requestsByEndpoint },
      tokens: {
        totalPromptTokens: this.totalPromptTokens,
        totalCandidatesTokens: this.totalCandidatesTokens,
        totalTokens: this.totalTokens,
      },
      cache: this.cache.getStats(),
      latencyMs: {
        averageGeminiCall,
      },
    };
  }
}
