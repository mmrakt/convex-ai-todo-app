// Simple logging utility for Convex environment

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  timestamp: number;
  userId?: string;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;

  constructor(logLevel: LogLevel = LogLevel.INFO) {
    this.logLevel = logLevel;
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  static create(context?: Record<string, any>): ContextLogger {
    const logger = Logger.getInstance();
    return new ContextLogger(logger, context);
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: Record<string, any>
  ): string {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const contextStr = context ? ` | ${JSON.stringify(context)}` : "";
    return `[${timestamp}] ${levelName}: ${message}${contextStr}`;
  }

  error(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(LogLevel.ERROR, message, context));
    }
  }

  warn(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, context));
    }
  }

  info(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage(LogLevel.INFO, message, context));
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }
}

// Context logger that adds default context to all log entries
class ContextLogger {
  constructor(
    private logger: Logger,
    private defaultContext?: Record<string, any>
  ) {}

  error(message: string, context?: Record<string, any>): void {
    this.logger.error(message, { ...this.defaultContext, ...context });
  }

  warn(message: string, context?: Record<string, any>): void {
    this.logger.warn(message, { ...this.defaultContext, ...context });
  }

  info(message: string, context?: Record<string, any>): void {
    this.logger.info(message, { ...this.defaultContext, ...context });
  }

  debug(message: string, context?: Record<string, any>): void {
    this.logger.debug(message, { ...this.defaultContext, ...context });
  }
}

// Convenience functions
export const logger = Logger.getInstance();

export function createLogger(context?: Record<string, any>): ContextLogger {
  return Logger.create(context);
}

// Performance monitoring utility
export function withPerformanceLogging<T>(
  operation: string,
  fn: () => Promise<T> | T,
  context?: Record<string, any>
): Promise<T> {
  const start = Date.now();
  const operationLogger = createLogger({ operation, ...context });

  operationLogger.debug(`Starting operation: ${operation}`);

  const handleResult = (result: T) => {
    const duration = Date.now() - start;
    operationLogger.info(`Operation completed: ${operation}`, { duration });
    return result;
  };

  const handleError = (error: any) => {
    const duration = Date.now() - start;
    operationLogger.error(`Operation failed: ${operation}`, {
      duration,
      error: error.message || error,
    });
    throw error;
  };

  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.then(handleResult).catch(handleError);
    } else {
      return Promise.resolve(handleResult(result));
    }
  } catch (error) {
    return Promise.reject(handleError(error));
  }
}
