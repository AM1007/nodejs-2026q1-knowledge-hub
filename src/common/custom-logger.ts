import { LoggerService } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

type LogLevel = 'log' | 'error' | 'warn' | 'debug' | 'verbose';

export class CustomLogger implements LoggerService {
  private level: LogLevel;
  private readonly logFilePath: string;
  private readonly maxFileSize: number;

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

    this.logFilePath = path.join(process.cwd(), 'logs', 'app.log');
    const maxSizeKb = parseInt(process.env.LOG_MAX_FILE_SIZE, 10) || 1024;
    this.maxFileSize = maxSizeKb * 1024; // KB → bytes

    // Создаём папку logs если не существует
    const logsDir = path.dirname(this.logFilePath);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  private writeToFile(message: string): void {
    try {
      // Проверяем размер файла перед записью
      if (fs.existsSync(this.logFilePath)) {
        const stats = fs.statSync(this.logFilePath);
        if (stats.size >= this.maxFileSize) {
          this.rotateFile();
        }
      }

      fs.appendFileSync(this.logFilePath, message + '\n');
    } catch (err) {
      // Если не удалось записать в файл — не роняем приложение
      console.error('Failed to write log to file:', err);
    }
  }

  private rotateFile(): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dir = path.dirname(this.logFilePath);
    const rotatedPath = path.join(dir, `app-${timestamp}.log`);

    fs.renameSync(this.logFilePath, rotatedPath);
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
    const formatted = this.formatMessage('log', message, context);
    console.log(formatted);
    this.writeToFile(formatted);
  }

  error(message: string, trace?: string, context?: string) {
    if (!this.isLevelEnabled('error')) return;
    const formatted = this.formatMessage('error', message, context);
    console.error(formatted);
    this.writeToFile(formatted);
    if (trace) {
      console.error(trace);
      this.writeToFile(trace);
    }
  }

  warn(message: string, context?: string) {
    if (!this.isLevelEnabled('warn')) return;
    const formatted = this.formatMessage('warn', message, context);
    console.warn(formatted);
    this.writeToFile(formatted);
  }

  debug(message: string, context?: string) {
    if (!this.isLevelEnabled('debug')) return;
    const formatted = this.formatMessage('debug', message, context);
    console.debug(formatted);
    this.writeToFile(formatted);
  }

  verbose(message: string, context?: string) {
    if (!this.isLevelEnabled('verbose')) return;
    const formatted = this.formatMessage('verbose', message, context);
    console.log(formatted);
    this.writeToFile(formatted);
  }
}
