import express from "express";
import type { Request, Response, NextFunction } from "express";

const router = express.Router();

export default (controllers: any) => {
  const { aiController } = controllers;

  router.post(
    "/suggest-category",
    (req: Request, res: Response, next: NextFunction) =>
      aiController.categorizeTransaction(req, res, next)
  );
  router.post("/feedback", (req: Request, res: Response, next: NextFunction) =>
    aiController.recordFeedback(req, res, next)
  );
  router.get(
    "/projections",
    (req: Request, res: Response, next: NextFunction) =>
      aiController.getProjectedExpenses(req, res, next)
  );
  router.get("/stats", (req: Request, res: Response, next: NextFunction) =>
    aiController.getAIStats(req, res, next)
  );

  return router;
};
