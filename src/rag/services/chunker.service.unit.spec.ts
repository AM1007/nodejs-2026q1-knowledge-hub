import { describe, it, expect } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { ChunkerService } from './chunker.service';

describe('ChunkerService', () => {
  const makeService = (size = 800, overlap = 200): ChunkerService => {
    const config = {
      getOrThrow: (key: string): string => {
        if (key === 'RAG_CHUNK_SIZE') return String(size);
        if (key === 'RAG_CHUNK_OVERLAP') return String(overlap);
        throw new Error(`Unknown key: ${key}`);
      },
    } as unknown as ConfigService;
    return new ChunkerService(config);
  };

  it('returns empty array for empty text', () => {
    expect(makeService().chunk('')).toEqual([]);
    expect(makeService().chunk('   ')).toEqual([]);
  });

  it('returns single chunk if text is shorter than chunkSize', () => {
    const result = makeService().chunk('hello world');
    expect(result).toEqual(['hello world']);
  });

  it('produces multiple chunks with overlap for long text', () => {
    const text = 'a '.repeat(1000); // ~2000 chars of "a a a..."
    const result = makeService(800, 200).chunk(text);
    expect(result.length).toBeGreaterThan(1);
    expect(result[0].length).toBeLessThanOrEqual(800);
  });

  it('throws if overlap >= chunkSize', () => {
    expect(() => makeService(500, 500)).toThrow(/must be less than/);
  });

  it('throws if chunkSize is invalid', () => {
    expect(() => makeService(0, 0)).toThrow(/must be > 0/);
  });
});
