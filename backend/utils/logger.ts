import morgan from "morgan";
import { config } from "../config/env";
import type { Request, Response, NextFunction } from "express";

interface Logger {
  info: (message: string, meta?: any) => void;
  error: (message: string, meta?: any) => void;
  warn: (message: string, meta?: any) => void;
  debug: (message: string, meta?: any) => void;
}

// Helper function to safely stringify metadata
const safeStringify = (obj: any): string => {
  try {
    return obj && typeof obj === 'object' ? JSON.stringify(obj) : String(obj);
  } catch (error) {
    return '[Circular or non-serializable object]';
  }
};

// Non-blocking logger using process.stdout.write and process.stderr.write
// This prevents I/O blocking issues in containerized environments like Railway
const logger: Logger = {
  info: (message: string, meta: any = {}) => {
    try {
      const timestamp = new Date().toISOString();
      const metaStr = Object.keys(meta).length > 0 ? ` ${safeStringify(meta)}` : '';
      process.stdout.write(`[${timestamp}] INFO: ${message}${metaStr}\n`);
    } catch (error) {
      // Fallback to console if process.stdout fails
      console.log(`[LOGGER ERROR] Failed to write info log: ${error}`);
    }
  },
  error: (message: string, meta: any = {}) => {
    try {
      const timestamp = new Date().toISOString();
      const metaStr = Object.keys(meta).length > 0 ? ` ${safeStringify(meta)}` : '';
      process.stderr.write(`[${timestamp}] ERROR: ${message}${metaStr}\n`);
    } catch (error) {
      // Fallback to console if process.stderr fails
      console.error(`[LOGGER ERROR] Failed to write error log: ${error}`);
    }
  },
  warn: (message: string, meta: any = {}) => {
    try {
      const timestamp = new Date().toISOString();
      const metaStr = Object.keys(meta).length > 0 ? ` ${safeStringify(meta)}` : '';
      process.stderr.write(`[${timestamp}] WARN: ${message}${metaStr}\n`);
    } catch (error) {
      // Fallback to console if process.stderr fails
      console.warn(`[LOGGER ERROR] Failed to write warn log: ${error}`);
    }
  },
  debug: (message: string, meta: any = {}) => {
    if (config.NODE_ENV !== "production") {
      try {
        const timestamp = new Date().toISOString();
        const metaStr = Object.keys(meta).length > 0 ? ` ${safeStringify(meta)}` : '';
        process.stdout.write(`[${timestamp}] DEBUG: ${message}${metaStr}\n`);
      } catch (error) {
        // Fallback to console if process.stdout fails
        console.log(`[LOGGER ERROR] Failed to write debug log: ${error}`);
      }
    }
  },
};

// Morgan stream that writes directly to stdout (non-blocking)
const stream = {
  write: (message: string) => {
    try {
      process.stdout.write(message);
    } catch (error) {
      // Silently fail if logging fails - don't crash the app
    }
  },
};

const morganMiddleware = morgan(
  ":method :url :status :res[content-length] - :response-time ms",
  { 
    stream,
    // Skip logging for health check endpoints to reduce noise
    skip: (req: Request) => {
      return req.url === '/' || req.url === '/health';
    }
  }
);

export { logger, morganMiddleware };
