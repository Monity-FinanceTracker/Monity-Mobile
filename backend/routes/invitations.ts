import express from "express";
import type { Request, Response, NextFunction } from "express";

export default (controllers: any) => {
  const router = express.Router();
  const { invitationController } = controllers;

  router.get("/pending", (req: Request, res: Response, next: NextFunction) =>
    invitationController.getPendingInvitations(req, res, next)
  );

  return router;
};
