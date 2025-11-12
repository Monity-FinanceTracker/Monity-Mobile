import express from "express";
import type { Request, Response, NextFunction } from "express";

const router = express.Router();

export default (controllers: any) => {
  const { recurringTransactionController } = controllers;

  router.get("/", (req: Request, res: Response, next: NextFunction) =>
    recurringTransactionController.getAll(req, res, next)
  );
  router.get("/:id", (req: Request, res: Response, next: NextFunction) =>
    recurringTransactionController.getById(req, res, next)
  );
  router.post("/", (req: Request, res: Response, next: NextFunction) =>
    recurringTransactionController.create(req, res, next)
  );
  router.put("/:id", (req: Request, res: Response, next: NextFunction) =>
    recurringTransactionController.update(req, res, next)
  );
  router.delete("/:id", (req: Request, res: Response, next: NextFunction) =>
    recurringTransactionController.delete(req, res, next)
  );

  return router;
};


