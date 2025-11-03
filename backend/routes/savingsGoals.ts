import express from "express";
import type { Request, Response, NextFunction } from "express";

const router = express.Router();

export default (controllers: any) => {
  const { savingsGoalController } = controllers;

  router.get("/", (req: Request, res: Response, next: NextFunction) =>
    savingsGoalController.getAllSavingsGoals(req, res, next)
  );
  router.post("/", (req: Request, res: Response, next: NextFunction) =>
    savingsGoalController.createSavingsGoal(req, res, next)
  );
  router.get("/:id", (req: Request, res: Response, next: NextFunction) =>
    savingsGoalController.getSavingsGoalById(req, res, next)
  );
  router.put("/:id", (req: Request, res: Response, next: NextFunction) =>
    savingsGoalController.updateSavingsGoal(req, res, next)
  );
  router.delete("/:id", (req: Request, res: Response, next: NextFunction) =>
    savingsGoalController.deleteSavingsGoal(req, res, next)
  );
  router.post(
    "/:id/allocate",
    (req: Request, res: Response, next: NextFunction) =>
      savingsGoalController.allocateToGoal(req, res, next)
  );
  router.post(
    "/:id/withdraw",
    (req: Request, res: Response, next: NextFunction) =>
      savingsGoalController.withdrawFromGoal(req, res, next)
  );

  return router;
};
