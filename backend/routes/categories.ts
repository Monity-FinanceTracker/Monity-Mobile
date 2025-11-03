import express from "express";
import type { Request, Response, NextFunction } from "express";

const router = express.Router();

export default (controllers: any) => {
  const { categoryController } = controllers;

  router.get("/", (req: Request, res: Response, next: NextFunction) =>
    categoryController.getAllCategories(req, res, next)
  );
  router.post("/", (req: Request, res: Response, next: NextFunction) =>
    categoryController.createCategory(req, res, next)
  );
  router.put("/:id", (req: Request, res: Response, next: NextFunction) =>
    categoryController.updateCategory(req, res, next)
  );
  router.delete("/:id", (req: Request, res: Response, next: NextFunction) =>
    categoryController.deleteCategory(req, res, next)
  );

  return router;
};
