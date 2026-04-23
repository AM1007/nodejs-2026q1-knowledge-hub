import { LoggerService } from '@nestjs/common';

type LogLevel = 'log' | 'error' | 'warn' | 'debug' | 'verbose';

export class CustomLogger implements LoggerService {
  private level: LogLevel;

  private readonly levels: LogLevel[] = [
    'verbose',
    'debug',
    'log',
    'warn',
    'error',
  ];

  constructor() {
    const envLevel = process.env.LOG_LEVEL as LogLevel;
    this.level = this.levels.includes(envLevel) ? envLevel : 'log';
  }

  private isLevelEnabled(level: LogLevel): boolean {
    return this.levels.indexOf(level) >= this.levels.indexOf(this.level);
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: string,
  ): string {
    const timestamp = new Date().toISOString();
    const ctx = context ? `[${context}]` : '';

    if (process.env.NODE_ENV === 'production') {
      // TODO: structured JSON for parsing
      return JSON.stringify({
        timestamp,
        level,
        context: context || null,
        message,
      });
    }

    return `${timestamp} [${level.toUpperCase()}] ${ctx} ${message}`;
  }

  log(message: string, context?: string) {
    if (!this.isLevelEnabled('log')) return;
    console.log(this.formatMessage('log', message, context));
  }

  error(message: string, trace?: string, context?: string) {
    if (!this.isLevelEnabled('error')) return;
    console.error(this.formatMessage('error', message, context));
    if (trace) {
      console.error(trace);
    }
  }

  warn(message: string, context?: string) {
    if (!this.isLevelEnabled('warn')) return;
    console.warn(this.formatMessage('warn', message, context));
  }

  debug(message: string, context?: string) {
    if (!this.isLevelEnabled('debug')) return;
    console.debug(this.formatMessage('debug', message, context));
  }

  verbose(message: string, context?: string) {
    if (!this.isLevelEnabled('verbose')) return;
    console.log(this.formatMessage('verbose', message, context));
  }
}
