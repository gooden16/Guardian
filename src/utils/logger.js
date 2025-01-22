// Logging levels
export const LogLevel = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // Keep last 1000 logs in memory
    this.isProduction = import.meta.env.PROD;
  }

  log(level, message, error = null, context = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : null,
      context
    };

    // Add to in-memory logs
    this.logs.unshift(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Console output with styling
    const styles = {
      [LogLevel.ERROR]: 'color: #ef4444; font-weight: bold',
      [LogLevel.WARN]: 'color: #f59e0b; font-weight: bold',
      [LogLevel.INFO]: 'color: #3b82f6',
      [LogLevel.DEBUG]: 'color: #6b7280'
    };

    console.log(
      `%c${level}%c ${timestamp} - ${message}`,
      styles[level],
      'color: inherit'
    );

    if (error) {
      console.error(error);
    }

    if (Object.keys(context).length > 0) {
      console.log('Context:', context);
    }

    // Send to error reporting service in production
    if (this.isProduction && level === LogLevel.ERROR) {
      this.reportError(error);
    }
  }

  error(message, error = null, context = {}) {
    this.log(LogLevel.ERROR, message, error, context);
  }

  warn(message, error = null, context = {}) {
    this.log(LogLevel.WARN, message, error, context);
  }

  info(message, context = {}) {
    this.log(LogLevel.INFO, message, null, context);
  }

  debug(message, context = {}) {
    if (!this.isProduction) {
      this.log(LogLevel.DEBUG, message, null, context);
    }
  }

  getLogs() {
    return [...this.logs];
  }

  reportError(error) {
    // TODO: Implement error reporting service integration
    // Example: Sentry, LogRocket, etc.
    console.error('Error reported:', error);
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logger = new Logger();