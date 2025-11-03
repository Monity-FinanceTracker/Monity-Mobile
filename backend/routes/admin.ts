import express from "express";
import type { Request, Response, NextFunction } from "express";

const router = express.Router();

export default (controllers: any) => {
  const { adminController } = controllers;

  router.get("/health", (req: Request, res: Response, next: NextFunction) =>
    adminController.getSystemHealth(req, res, next)
  );
  router.get("/stats", (req: Request, res: Response, next: NextFunction) =>
    adminController.getUserStats(req, res, next)
  );
  router.get("/analytics", (req: Request, res: Response, next: NextFunction) =>
    adminController.getAnalytics(req, res, next)
  );
  router.get("/trends", (req: Request, res: Response, next: NextFunction) =>
    adminController.getTrends(req, res, next)
  );
  router.get(
    "/financial-health",
    (req: Request, res: Response, next: NextFunction) =>
      adminController.getFinancialHealthMetrics(req, res, next)
  );

  return router;
};
