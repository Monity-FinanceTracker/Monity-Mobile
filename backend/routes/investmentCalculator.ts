import express from "express";
import type { Request, Response, NextFunction } from "express";

const router = express.Router();

export default (controllers: any) => {
  const { investmentCalculatorController } = controllers;

  router.post(
    "/calculate",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await investmentCalculatorController.calculateInvestment(req, res);
      } catch (error) {
        next(error);
      }
    }
  );
  router.get(
    "/usage",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await investmentCalculatorController.getUsage(req, res);
      } catch (error) {
        next(error);
      }
    }
  );
  router.get(
    "/simulations",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await investmentCalculatorController.getSimulations(req, res);
      } catch (error) {
        next(error);
      }
    }
  );
  router.delete(
    "/simulations/:id",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await investmentCalculatorController.deleteSimulation(req, res);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
};



