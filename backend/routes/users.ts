import express from "express";
import type { Request, Response, NextFunction } from "express";

const router = express.Router();

export default (controllers: any) => {
  const { userController } = controllers;

  // User search endpoint
  router.get("/search", (req: Request, res: Response, next: NextFunction) =>
    userController.searchUsers(req, res, next)
  );

  return router;
};
