export class NotFoundError extends Error {
  public readonly statusCode = 404;

  constructor(message = 'Not Found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  public readonly statusCode = 400;

  constructor(message = 'Bad Request') {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends Error {
  public readonly statusCode = 401;

  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  public readonly statusCode = 403;

  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}
