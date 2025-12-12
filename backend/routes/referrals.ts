import express from "express";
import type { Request, Response, NextFunction } from "express";

const router = express.Router();

export default (controllers: any) => {
  const { referralController } = controllers;

  // Get or generate user's referral code
  router.get(
    "/my-code",
    (req: Request, res: Response, next: NextFunction) =>
      referralController.getMyCode(req, res)
  );

  // Validate a referral code (used during signup)
  router.post(
    "/validate-code",
    (req: Request, res: Response, next: NextFunction) =>
      referralController.validateCode(req, res)
  );

  // Get detailed referral statistics
  router.get(
    "/stats",
    (req: Request, res: Response, next: NextFunction) =>
      referralController.getStats(req, res)
  );

  // Get paginated list of referrals
  router.get(
    "/list",
    (req: Request, res: Response, next: NextFunction) =>
      referralController.listReferrals(req, res)
  );

  // Get referrals leaderboard
  router.get(
    "/leaderboard",
    (req: Request, res: Response, next: NextFunction) =>
      referralController.getLeaderboard(req, res)
  );

  // Regenerate referral code (max once per month)
  router.post(
    "/regenerate-code",
    (req: Request, res: Response, next: NextFunction) =>
      referralController.regenerateCode(req, res)
  );

  return router;
};



