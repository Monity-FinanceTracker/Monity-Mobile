import express from "express";
import type { Request, Response, NextFunction } from "express";

const router = express.Router();

export default (controllers: any) => {
  const { groupController } = controllers;

  // Group CRUD operations
  router.get("/", (req: Request, res: Response, next: NextFunction) =>
    groupController.getAllGroups(req, res, next)
  );
  router.get("/:id", (req: Request, res: Response, next: NextFunction) =>
    groupController.getGroupById(req, res, next)
  );
  router.post("/", (req: Request, res: Response, next: NextFunction) =>
    groupController.createGroup(req, res, next)
  );
  router.put("/:id", (req: Request, res: Response, next: NextFunction) =>
    groupController.updateGroup(req, res, next)
  );
  router.delete("/:id", (req: Request, res: Response, next: NextFunction) =>
    groupController.deleteGroup(req, res, next)
  );

  // Group member management
  router.post(
    "/:id/members",
    (req: Request, res: Response, next: NextFunction) =>
      groupController.addGroupMember(req, res, next)
  );
  router.delete("/:id/members/:userId", (req, res, next) =>
    groupController.removeGroupMember(req, res, next)
  );
  router.post("/:id/invite", (req, res, next) =>
    groupController.sendGroupInvitation(req, res, next)
  );

  // Group expense management
  router.post("/:id/expenses", (req, res, next) =>
    groupController.addGroupExpense(req, res, next)
  );
  router.put("/expenses/:expenseId", (req, res, next) =>
    groupController.updateGroupExpense(req, res, next)
  );
  router.delete("/expenses/:expenseId", (req, res, next) =>
    groupController.deleteGroupExpense(req, res, next)
  );

  // Expense share settlement
  router.post("/shares/:shareId/settle", (req, res, next) =>
    groupController.settleExpenseShare(req, res, next)
  );

  return router;
};
