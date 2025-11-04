import express from "express";
import type { Request, Response, NextFunction } from "express";

const router = express.Router();

export default (controllers: any, middleware: any) => {
  const { authController } = controllers;

  // Public endpoints (not authenticated) - use stricter rate limiting
  router.post("/register", 
    middleware.rateLimiter.authLimiter,
    (req: Request, res: Response, next: NextFunction) =>
      authController.register(req, res, next)
  );
  router.post("/check-email",
    middleware.rateLimiter.authLimiter,
    (req: Request, res: Response, next: NextFunction) =>
      authController.checkEmailExists(req, res, next)
  );
  router.post("/login",
    middleware.rateLimiter.authLimiter,
    (req: Request, res: Response, next: NextFunction) =>
      authController.login(req, res, next)
  );
  
  // Authenticated endpoints - use general rate limiting (already applied by v1Router)
  // These endpoints are protected by authentication, so they don't need strict rate limiting
  router.get(
    "/profile",
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
