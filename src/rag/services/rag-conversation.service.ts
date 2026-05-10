import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConversationMessage } from '../../ai/conversation.service';

interface RagSession {
  messages: ConversationMessage[];
  lastAccessedAt: number;
}

const SESSION_TTL_MS = 30 * 60 * 1000;

@Injectable()
export class RagConversationService {
  private readonly logger = new Logger(RagConversationService.name);
  private readonly sessions = new Map<string, RagSession>();
  private readonly maxMessages: number;

  constructor(private readonly config: ConfigService) {
    this.maxMessages = parseInt(
      this.config.getOrThrow<string>('RAG_CONVERSATION_MAX_MESSAGES'),
      10,
    );
    if (Number.isNaN(this.maxMessages) || this.maxMessages <= 0) {
      throw new Error('RAG_CONVERSATION_MAX_MESSAGES must be > 0');
    }
  }

  getHistory(sessionId: string): ConversationMessage[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    if (Date.now() - session.lastAccessedAt > SESSION_TTL_MS) {
      this.sessions.delete(sessionId);
      return [];
    }

    return [...session.messages];
  }

  appendMessages(sessionId: string, ...messages: ConversationMessage[]): void {
    const existing = this.sessions.get(sessionId);
    const allMessages = [...(existing?.messages ?? []), ...messages];
    const trimmed = allMessages.slice(-this.maxMessages);

    this.sessions.set(sessionId, {
      messages: trimmed,
      lastAccessedAt: Date.now(),
    });
  }
}
