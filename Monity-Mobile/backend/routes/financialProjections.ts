import express from "express";
import type { Request, Response, NextFunction } from "express";

const router = express.Router();

export default (controllers: any) => {
  const { financialProjectionsController } = controllers;

  router.post("/", (req: Request, res: Response, next: NextFunction) =>
    financialProjectionsController.createProjection(req, res, next)
  );
  router.get("/:goalId", (req: Request, res: Response, next: NextFunction) =>
    financialProjectionsController.getProjection(req, res, next)
  );

  return router;
};
