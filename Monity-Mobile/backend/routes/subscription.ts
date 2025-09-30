import express from "express";
import type { Request, Response, NextFunction } from "express";

const router = express.Router();

export default (controllers: any) => {
  const { subscriptionController } = controllers;
  router.get("/", (req: Request, res: Response, next: NextFunction) =>
    subscriptionController.getSubscriptionTier(req, res, next)
  );
  return router;
};
