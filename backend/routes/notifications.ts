import express from "express";
import type { Request, Response, NextFunction } from "express";

const router = express.Router();

export default (controllers: any) => {
  const { notificationController } = controllers;

  // POST /api/v1/notifications/register-token
  router.post("/register-token", (req: Request, res: Response, next: NextFunction) =>
    notificationController.registerToken(req, res, next)
  );

  // POST /api/v1/notifications/unregister-token
  router.post("/unregister-token", (req: Request, res: Response, next: NextFunction) =>
    notificationController.unregisterToken(req, res, next)
  );

  // GET /api/v1/notifications/preferences
  router.get("/preferences", (req: Request, res: Response, next: NextFunction) =>
    notificationController.getPreferences(req, res, next)
  );

  // PUT /api/v1/notifications/preferences
  router.put("/preferences", (req: Request, res: Response, next: NextFunction) =>
    notificationController.updatePreferences(req, res, next)
  );

  // GET /api/v1/notifications/history
  router.get("/history", (req: Request, res: Response, next: NextFunction) =>
    notificationController.getHistory(req, res, next)
  );

  // GET /api/v1/notifications/stats
  router.get("/stats", (req: Request, res: Response, next: NextFunction) =>
    notificationController.getStats(req, res, next)
  );

  // POST /api/v1/notifications/test (development only)
  router.post("/test", (req: Request, res: Response, next: NextFunction) =>
    notificationController.sendTest(req, res, next)
  );

  return router;
};
