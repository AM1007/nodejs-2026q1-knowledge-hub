import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChunkerService {
  private readonly logger = new Logger(ChunkerService.name);
  private readonly chunkSize: number;
  private readonly chunkOverlap: number;

  constructor(private readonly config: ConfigService) {
    this.chunkSize = parseInt(
      this.config.getOrThrow<string>('RAG_CHUNK_SIZE'),
      10,
    );
    this.chunkOverlap = parseInt(
      this.config.getOrThrow<string>('RAG_CHUNK_OVERLAP'),
      10,
    );

    if (
      Number.isNaN(this.chunkSize) ||
      this.chunkSize <= 0 ||
      Number.isNaN(this.chunkOverlap) ||
      this.chunkOverlap < 0
    ) {
      throw new Error(
        'RAG_CHUNK_SIZE must be > 0 and RAG_CHUNK_OVERLAP must be >= 0',
      );
    }

    if (this.chunkOverlap >= this.chunkSize) {
      throw new Error(
        `RAG_CHUNK_OVERLAP (${this.chunkOverlap}) must be less than RAG_CHUNK_SIZE (${this.chunkSize})`,
      );
    }
  }

  chunk(text: string): string[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const chunks: string[] = [];
    const length = text.length;
    let start = 0;

    while (start < length) {
      let end = Math.min(start + this.chunkSize, length);

      if (end < length) {
        const boundary = this.findWhitespaceBoundary(text, start, end);
        if (boundary > start) {
          end = boundary;
        }
      }

      const piece = text.slice(start, end).trim();
      if (piece.length > 0) {
        chunks.push(piece);
      }

      if (end >= length) {
        break;
      }

      const nextStart = end - this.chunkOverlap;
      start = nextStart > start ? nextStart : end;
    }

    return chunks;
  }

  private findWhitespaceBoundary(
    text: string,
    start: number,
    end: number,
  ): number {
    for (let i = end; i > start; i--) {
      if (/\s/.test(text[i])) {
        return i;
      }
    }
    return -1;
  }
}
