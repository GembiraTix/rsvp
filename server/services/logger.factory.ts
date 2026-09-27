import type { ILogger } from './logger.service'

class ConsolaLogger implements ILogger {
  info(message: string, meta?: Record<string, unknown>): void {
    console.info(`[INFO] ${message}`, meta ? JSON.stringify(meta) : '')
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta) : '')
  }

  error(message: string, meta?: Record<string, unknown>): void {
    console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta) : '')
  }
}

export function buildLogger(): ILogger {
  return new ConsolaLogger()
}
