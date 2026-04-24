import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = 500;
    let message = 'An unexpected error occurred';
    let error = 'Internal Server Error';

    if (exception instanceof Error && 'statusCode' in exception) {
      statusCode = (exception as any).statusCode;
      message = exception.message;
      error = exception.name;
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message || message;
      error = (res as any).error || exception.name;
    }

    const stack =
      exception instanceof Error ? exception.stack : String(exception);
    this.logger.error(`${statusCode} ${message}`, stack);

    response.status(statusCode).json({
      statusCode,
      error,
      message,
    });
  }
}
