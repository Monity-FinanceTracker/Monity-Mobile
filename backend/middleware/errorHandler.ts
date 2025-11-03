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
  console.log("=".repeat(80));
  console.log("🚨 ERROR HANDLER TRIGGERED");
  console.log("=".repeat(80));
  console.error("Error:", err);
  console.error("Error message:", err.message);
  console.error("Error stack:", err.stack);
  console.error("Request path:", req.path);
  console.error("Request method:", req.method);
  
  logger.error(err.message, {
    stack: err.stack,
    path: req.path,
    method: req.method,
    user: (req as any).user ? (req as any).user.id : "anonymous",
    fullError: err,
  });

  const statusCode = err.statusCode || 500;
  
  // If response was already sent, don't send again
  if (res.headersSent) {
    return next(err);
  }
  
  const response = {
    success: false,
    error: err.message || "Internal Server Error",
    message: err.message || "Internal Server Error", // Keep both for compatibility
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
