import express from "express";
import type { Request, Response, NextFunction } from "express";

const router = express.Router();

export default (controllers: any, middleware: any) => {
  const { authController } = controllers;

  router.post("/register", (req: Request, res: Response, next: NextFunction) =>
    authController.register(req, res, next)
  );
  router.post("/login", (req: Request, res: Response, next: NextFunction) =>
    authController.login(req, res, next)
  );
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
