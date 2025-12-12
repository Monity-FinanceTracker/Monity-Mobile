import express from "express";
import type { Request, Response, NextFunction } from "express";

const router = express.Router();

export default (controllers: any) => {
  const { onboardingController } = controllers;

  // Get onboarding progress
  router.get(
    "/progress",
    (req: Request, res: Response, next: NextFunction) =>
      onboardingController.getOnboardingProgress(req, res)
  );

  // Start onboarding
  router.post(
    "/start",
    (req: Request, res: Response, next: NextFunction) =>
      onboardingController.startOnboarding(req, res)
  );

  // Complete a step
  router.post(
    "/complete-step",
    (req: Request, res: Response, next: NextFunction) =>
      onboardingController.completeStep(req, res)
  );

  // Complete entire onboarding
  router.post(
    "/complete",
    (req: Request, res: Response, next: NextFunction) =>
      onboardingController.completeOnboarding(req, res)
  );

  // Skip onboarding
  router.post(
    "/skip",
    (req: Request, res: Response, next: NextFunction) =>
      onboardingController.skipOnboarding(req, res)
  );

  // Update checklist progress
  router.post(
    "/checklist",
    (req: Request, res: Response, next: NextFunction) =>
      onboardingController.updateChecklistProgress(req, res)
  );

  return router;
};


