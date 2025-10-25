/**
 * Logger Utility
 * Simple logging wrapper
 */

interface LogContext {
  [key: string]: any;
}

class Logger {
  private context: string;

  constructor(context?: string) {
    this.context = context || 'App';
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? JSON.stringify(context) : '';
    return `[${timestamp}] [${level}] [${this.context}] ${message} ${contextStr}`;
  }

  info(message: string, context?: LogContext) {
    console.log(this.formatMessage('INFO', message, context));
  }

  error(message: string, context?: LogContext) {
    console.error(this.formatMessage('ERROR', message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage('WARN', message, context));
  }

  debug(message: string, context?: LogContext) {
    if (process.env.DEBUG) {
      console.debug(this.formatMessage('DEBUG', message, context));
    }
  }
}

export default new Logger('BarberPro');
