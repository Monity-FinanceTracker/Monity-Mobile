import express from "express";
import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

const router = express.Router();

// Request logging middleware
const logRequest = (endpoint: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const requestId = Math.random().toString(36).substring(7);
    logger.info(`[${requestId}] 📥 Auth route hit: ${endpoint}`, {
      method: req.method,
      path: req.path,
      fullUrl: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      contentType: req.get('content-type'),
      bodySize: req.body ? JSON.stringify(req.body).length : 0
    });
    next();
  };
};

export default (controllers: any, middleware: any) => {
  const { authController } = controllers;

  // Debug middleware to log ALL requests to auth routes
  router.use((req: Request, res: Response, next: NextFunction) => {
    logger.info('🔍 Auth router received request', {
      method: req.method,
      path: req.path,
      originalUrl: req.originalUrl,
      body: req.body,
      headers: {
        'content-type': req.get('content-type'),
        'user-agent': req.get('user-agent')
      }
    });
    next();
  });

  // Public endpoints (not authenticated) - use stricter rate limiting
  router.post("/register",
    logRequest("register"),
    middleware.rateLimiter.authLimiter,
    (req: Request, res: Response, next: NextFunction) =>
      authController.register(req, res, next)
  );
  router.post("/check-email",
    logRequest("check-email"),
    middleware.rateLimiter.authLimiter,
    (req: Request, res: Response, next: NextFunction) =>
      authController.checkEmailExists(req, res, next)
  );
  router.post("/login",
    logRequest("login"),
    middleware.rateLimiter.authLimiter,
    (req: Request, res: Response, next: NextFunction) =>
      authController.login(req, res, next)
  );
  
  // Authenticated endpoints - use general rate limiting (already applied by v1Router)
  // These endpoints are protected by authentication, so they don't need strict rate limiting
  router.get(
    "/profile",
    logRequest("profile"),
    middleware.auth.authenticate,
    (req: Request, res: Response, next: NextFunction) =>
      authController.getProfile(req, res, next)
  );
  router.get(
    "/financial-health",
    middleware.auth.authenticate,
    (req: Request, res: Response, next: NextFunction) =>
      authController.getFinancialHealth(req, res, next)
  );
  router.put(
    "/profile",
    middleware.auth.authenticate,
    (req: Request, res: Response, next: NextFunction) =>
      authController.updateProfile(req, res, next)
  );
  router.post(
    "/change-password",
    middleware.auth.authenticate,
    (req: Request, res: Response, next: NextFunction) =>
      authController.changePassword(req, res, next)
  );
  router.delete(
    "/delete-account",
    middleware.auth.authenticate,
    (req: Request, res: Response, next: NextFunction) =>
      authController.deleteAccount(req, res, next)
  );

  return router;
};
