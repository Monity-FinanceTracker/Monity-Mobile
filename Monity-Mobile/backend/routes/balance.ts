import express from "express";
import type { Request, Response, NextFunction } from "express";

const router = express.Router();

export default (controllers: any) => {
  const { balanceController } = controllers;

  router.get("/all", (req: Request, res: Response, next: NextFunction) =>
    balanceController.getBalance(req, res, next)
  );
  router.get(
    "/savings-overview",
    (req: Request, res: Response, next: NextFunction) =>
      balanceController.getSavingsOverview(req, res, next)
  );
  router.get(
    "/:month/:year",
    (req: Request, res: Response, next: NextFunction) =>
      balanceController.getMonthlyBalance(req, res, next)
  );
  router.get("/history", (req: Request, res: Response, next: NextFunction) =>
    balanceController.getBalanceHistory(req, res, next)
  );

  return router;
};
