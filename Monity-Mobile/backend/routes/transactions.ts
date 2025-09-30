import express from "express";
import type { Request, Response, NextFunction } from "express";

const router = express.Router();

export default (controllers: any) => {
  const { transactionController } = controllers;

  router.get("/", (req: Request, res: Response, next: NextFunction) =>
    transactionController.getAllTransactions(req, res, next)
  );
  router.get("/recent", (req: Request, res: Response, next: NextFunction) =>
    transactionController.getRecentTransactions(req, res, next)
  );
  router.get("/:id", (req: Request, res: Response, next: NextFunction) =>
    transactionController.getTransactionById(req, res, next)
  );
  router.post("/", (req: Request, res: Response, next: NextFunction) =>
    transactionController.createTransaction(req, res, next)
  );
  router.put("/:id", (req: Request, res: Response, next: NextFunction) =>
    transactionController.updateTransaction(req, res, next)
  );
  router.delete("/:id", (req: Request, res: Response, next: NextFunction) =>
    transactionController.deleteTransaction(req, res, next)
  );

  // Legacy routes for frontend compatibility
  router.post(
    "/add-expense",
    (req: Request, res: Response, next: NextFunction) => {
      // Add typeId for expense (1)
      req.body.typeId = 1;
      return transactionController.createTransaction(req, res, next);
    }
  );

  router.post(
    "/add-income",
    (req: Request, res: Response, next: NextFunction) => {
      // Add typeId for income (2)
      req.body.typeId = 2;
      return transactionController.createTransaction(req, res, next);
    }
  );

  return router;
};
