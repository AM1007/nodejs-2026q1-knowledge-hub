import { Injectable } from '@nestjs/common';

export interface ConversationMessage {
  role: 'user' | 'model';
  text: string;
}

interface Session {
  messages: ConversationMessage[];
  lastAccessedAt: number;
}

const SESSION_TTL_MS = 30 * 60 * 1000;
const MAX_MESSAGES_PER_SESSION = 10;

@Injectable()
export class ConversationService {
  private readonly sessions = new Map<string, Session>();

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

    const trimmed = allMessages.slice(-MAX_MESSAGES_PER_SESSION);

    this.sessions.set(sessionId, {
      messages: trimmed,
      lastAccessedAt: Date.now(),
    });
  }
}
