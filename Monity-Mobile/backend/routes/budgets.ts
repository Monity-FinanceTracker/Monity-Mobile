import express from "express";
import type { Request, Response, NextFunction } from "express";

const router = express.Router();

export default (controllers: any) => {
  const { budgetController } = controllers;

  router.get("/", (req: Request, res: Response, next: NextFunction) =>
    budgetController.getAllBudgets(req, res, next)
  );
  router.post("/", (req: Request, res: Response, next: NextFunction) =>
    budgetController.createBudget(req, res, next)
  );
  router.put("/:id", (req: Request, res: Response, next: NextFunction) =>
    budgetController.updateBudget(req, res, next)
  );
  router.delete("/:id", (req: Request, res: Response, next: NextFunction) =>
    budgetController.deleteBudget(req, res, next)
  );

  return router;
};
