import { Injectable } from '@nestjs/common';

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

  recordRequest(endpoint: AiEndpoint, usage?: GeminiUsage): void {
    this.totalRequests += 1;
    this.requestsByEndpoint[endpoint] += 1;

    if (usage) {
      this.totalPromptTokens += usage.promptTokenCount ?? 0;
      this.totalCandidatesTokens += usage.candidatesTokenCount ?? 0;
      this.totalTokens += usage.totalTokenCount ?? 0;
    }
  }

  getStats(): UsageStats {
    return {
      totalRequests: this.totalRequests,
      requestsByEndpoint: { ...this.requestsByEndpoint },
      tokens: {
        totalPromptTokens: this.totalPromptTokens,
        totalCandidatesTokens: this.totalCandidatesTokens,
        totalTokens: this.totalTokens,
      },
    };
  }
}
