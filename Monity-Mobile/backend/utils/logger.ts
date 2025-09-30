import morgan from "morgan";
import { config } from "../config/env";
import type { Request, Response, NextFunction } from "express";

interface Logger {
  info: (message: string, meta?: any) => void;
  error: (message: string, meta?: any) => void;
  warn: (message: string, meta?: any) => void;
  debug: (message: string, meta?: any) => void;
}

// Simple console logger
const logger: Logger = {
  info: (message: string, meta: any = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] INFO: ${message}`, meta);
  },
  error: (message: string, meta: any = {}) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR: ${message}`, meta);
  },
  warn: (message: string, meta: any = {}) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] WARN: ${message}`, meta);
  },
  debug: (message: string, meta: any = {}) => {
    if (config.NODE_ENV !== "production") {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] DEBUG: ${message}`, meta);
    }
  },
};

const stream = {
  write: (message: string) => logger.info(message.trim()),
};

const morganMiddleware = morgan(
  ":method :url :status :res[content-length] - :response-time ms",
  { stream }
);

export { logger, morganMiddleware };
