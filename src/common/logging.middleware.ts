import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') return body;
    const sanitized = { ...body };
    if ('password' in sanitized) {
      sanitized.password = '[REDACTED]';
    }
    if ('token' in sanitized) {
      sanitized.token = '[REDACTED]';
    }
    return sanitized;
  }

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, query, body } = req;
    const start = Date.now();

    this.logger.log(
      `Request: ${method} ${originalUrl} query=${JSON.stringify(query)} body=${JSON.stringify(this.sanitizeBody(body))}`,
    );

    res.on('finish', () => {
      const duration = Date.now() - start;
      this.logger.log(
        `Response: ${method} ${originalUrl} ${res.statusCode} ${duration}ms`,
      );
    });

    next();
  }
}
