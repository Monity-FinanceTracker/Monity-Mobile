import express from "express";
import type { Request, Response, NextFunction } from "express";

const router = express.Router();

export default (controllers: any) => {
  const { investmentCalculatorController } = controllers;

  router.post(
    "/calculate",
    (req: Request, res: Response, next: NextFunction) =>
      investmentCalculatorController.calculateInvestment(req, res)
  );
  router.get(
    "/usage",
    (req: Request, res: Response, next: NextFunction) =>
      investmentCalculatorController.getUsage(req, res)
  );
  router.get(
    "/simulations",
    (req: Request, res: Response, next: NextFunction) =>
      investmentCalculatorController.getSimulations(req, res)
  );
  router.delete(
    "/simulations/:id",
    (req: Request, res: Response, next: NextFunction) =>
      investmentCalculatorController.deleteSimulation(req, res)
  );

  return router;
};


