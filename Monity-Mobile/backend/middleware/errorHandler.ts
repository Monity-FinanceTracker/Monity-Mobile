import { logger } from "../utils/logger";
import { config } from "../config";
import type { Request, Response, NextFunction } from "express";

interface CustomError extends Error {
  statusCode?: number;
}

const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(err.message, {
    stack: err.stack,
    path: req.path,
    method: req.method,
    user: (req as any).user ? (req as any).user.id : "anonymous",
  });

  const statusCode = err.statusCode || 500;
  const response = {
    success: false,
    message: err.message || "Internal Server Error",
    ...(config.NODE_ENV === "development" && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};

const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    success: false,
    message: `Not Found - ${req.method} ${req.originalUrl}`,
  });
};

export { errorHandler, notFoundHandler };
