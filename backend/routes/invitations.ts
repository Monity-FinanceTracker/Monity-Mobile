import express from "express";
import type { Request, Response, NextFunction } from "express";

export default (controllers: any) => {
  const router = express.Router();
  const { invitationController } = controllers;

  // Authenticated routes
  router.get("/pending", (req: Request, res: Response, next: NextFunction) =>
    invitationController.getPendingInvitations(req, res, next)
  );
  router.post(
    "/:invitationId/respond",
    (req: Request, res: Response, next: NextFunction) =>
      invitationController.respondToInvitation(req, res, next)
  );

  return router;
};
