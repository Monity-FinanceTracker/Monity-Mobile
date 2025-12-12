import express from "express";
import type { Request, Response, NextFunction } from "express";

const router = express.Router();

export default (controllers: any) => {
  const { cashFlowController } = controllers;

  // Scheduled Transaction Routes
  router.get(
    "/scheduled-transactions",
    (req: Request, res: Response, next: NextFunction) =>
      cashFlowController.getAllScheduledTransactions(req, res)
  );
  router.get(
    "/scheduled-transactions/:id",
    (req: Request, res: Response, next: NextFunction) =>
      cashFlowController.getScheduledTransactionById(req, res)
  );
  router.post(
    "/scheduled-transactions",
    (req: Request, res: Response, next: NextFunction) =>
      cashFlowController.createScheduledTransaction(req, res)
  );
  router.put(
    "/scheduled-transactions/:id",
    (req: Request, res: Response, next: NextFunction) =>
      cashFlowController.updateScheduledTransaction(req, res)
  );
  router.delete(
    "/scheduled-transactions/:id",
    (req: Request, res: Response, next: NextFunction) =>
      cashFlowController.deleteScheduledTransaction(req, res)
  );

  // Calendar Data Route
  router.get(
    "/calendar-data",
    (req: Request, res: Response, next: NextFunction) =>
      cashFlowController.getCalendarData(req, res)
  );

  return router;
};


