import express from "express";
import type { Request, Response, NextFunction } from "express";

const router = express.Router();

export default (controllers: any, middleware: any) => {
  const { subscriptionController } = controllers;
  
  // GET /subscription-tier - Get user's current subscription tier
  router.get("/", (req: Request, res: Response, next: NextFunction) =>
    subscriptionController.getSubscriptionTier(req, res, next)
  );
  
  // GET /plans - Get available subscription plans
  router.get("/plans", (req: Request, res: Response, next: NextFunction) =>
    subscriptionController.getSubscriptionPlans(req, res, next)
  );
  
  // POST /create - Create new subscription (com rate limiting específico para pagamentos)
  router.post("/create", 
    middleware.rateLimiter.paymentLimiter,
    (req: Request, res: Response, next: NextFunction) =>
      subscriptionController.createSubscription(req, res, next)
  );
  
  // POST /cancel - Cancel subscription
  router.post("/cancel", (req: Request, res: Response, next: NextFunction) =>
    subscriptionController.cancelSubscription(req, res, next)
  );
  
  return router;
};
