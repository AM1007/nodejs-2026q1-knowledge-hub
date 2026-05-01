import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRatio: number;
}

@Injectable()
export class CacheService {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly ttlMs: number;
  private hits = 0;
  private misses = 0;

  constructor(private readonly configService: ConfigService) {
    const ttlSec = this.configService.get<number>('AI_CACHE_TTL_SEC', 300);
    this.ttlMs = ttlSec * 1000;
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses += 1;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses += 1;
      return null;
    }

    this.hits += 1;
    return entry.value as T;
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRatio: total === 0 ? 0 : Number((this.hits / total).toFixed(3)),
    };
  }
}
