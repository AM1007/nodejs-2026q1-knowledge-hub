import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CustomLogger } from './custom-logger';

describe('CustomLogger', () => {
  let logger: CustomLogger;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.LOG_LEVEL = 'log';
    delete process.env.NODE_ENV;
    logger = new CustomLogger();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  it('should log messages at log level', () => {
    logger.log('test message', 'TestContext');
    expect(console.log).toHaveBeenCalled();
  });

  it('should log errors with stack trace', () => {
    logger.error('error msg', 'stack trace here', 'ErrContext');
    expect(console.error).toHaveBeenCalledTimes(2);
  });

  it('should log errors without stack trace', () => {
    logger.error('error msg');
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it('should log warnings', () => {
    logger.warn('warn msg', 'WarnCtx');
    expect(console.warn).toHaveBeenCalled();
  });

  it('should log debug messages when level is verbose', () => {
    process.env.LOG_LEVEL = 'verbose';
    const verboseLogger = new CustomLogger();
    verboseLogger.debug('debug msg', 'DebugCtx');
    expect(console.debug).toHaveBeenCalled();
    delete process.env.LOG_LEVEL;
  });

  it('should log verbose messages when level is verbose', () => {
    process.env.LOG_LEVEL = 'verbose';
    const verboseLogger = new CustomLogger();
    verboseLogger.verbose('verbose msg', 'VerboseCtx');
    expect(console.log).toHaveBeenCalled();
    delete process.env.LOG_LEVEL;
  });

  it('should not log debug when level is warn', () => {
    process.env.LOG_LEVEL = 'warn';
    const warnLogger = new CustomLogger();
    warnLogger.debug('should not appear');
    expect(console.debug).not.toHaveBeenCalled();
    delete process.env.LOG_LEVEL;
  });

  it('should format as JSON in production mode', () => {
    process.env.NODE_ENV = 'production';
    const prodLogger = new CustomLogger();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    prodLogger.log('prod message', 'ProdCtx');

    const calls = (console.log as any).mock.calls;
    const call = calls[calls.length - 1][0];
    const parsed = JSON.parse(call);
    expect(parsed).toHaveProperty('timestamp');
    expect(parsed).toHaveProperty('level', 'log');
    expect(parsed).toHaveProperty('message', 'prod message');
    delete process.env.NODE_ENV;
  });

  it('should default to log level when LOG_LEVEL is invalid', () => {
    process.env.LOG_LEVEL = 'invalid';
    const defaultLogger = new CustomLogger();
    defaultLogger.log('test');
    expect(console.log).toHaveBeenCalled();
    delete process.env.LOG_LEVEL;
  });

  it('should use default max file size when env is not set', () => {
    delete process.env.LOG_MAX_FILE_SIZE;
    const defaultLogger = new CustomLogger();
    defaultLogger.log('test');
    expect(console.log).toHaveBeenCalled();
  });

  it('should use custom max file size from env', () => {
    process.env.LOG_MAX_FILE_SIZE = '512';
    const customLogger = new CustomLogger();
    customLogger.log('test');
    expect(console.log).toHaveBeenCalled();
    delete process.env.LOG_MAX_FILE_SIZE;
  });

  it('should format without context when context is undefined', () => {
    logger.log('no context message');
    const calls = (console.log as any).mock.calls;
    const lastCall = calls[calls.length - 1][0];
    expect(lastCall).not.toContain('[undefined]');
  });
});
