import express from "express";
import path from "path";

import authRoutes from "./auth";
import transactionRoutes from "./transactions";
import categoryRoutes from "./categories";
import groupRoutes from "./groups";
import savingsGoalsRoutes from "./savingsGoals";
import adminRoutes from "./admin";
import aiRoutes from "./ai";
import subscriptionRoutes from "./subscription";
import balanceRoutes from "./balance";
import invitationRoutes from "./invitations";
import financialProjectionsRoutes from "./financialProjections";
import userRoutes from "./users";
import recurringTransactionsRoutes from "./recurringTransactions";

export default (controllers: any, middleware: any) => {
  // Version 1 of the API
  const v1Router = express.Router();

  // Apply general rate limiting to all v1 routes
  v1Router.use(middleware.rateLimiter.apiLimiter);

  // Root API route for health check
  v1Router.get("/", (req: any, res: any) => {
    res.json({
      message: "Monity API v1 is running",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      status: "healthy",
    });
  });

  // Auth routes - rate limiting is applied per endpoint in authRoutes
  // Public endpoints (login, register) use authLimiter
  // Authenticated endpoints use apiLimiter (already applied above)
  v1Router.use(
    "/auth",
    authRoutes(controllers, middleware)
  );

  // Authenticated routes
  v1Router.get(
    "/months",
    middleware.auth.authenticate,
    controllers.balanceController.getMonths
  );
  v1Router.use(
    "/transactions",
    middleware.auth.authenticate,
    transactionRoutes(controllers)
  );
  v1Router.use(
    "/categories",
    middleware.auth.authenticate,
    categoryRoutes(controllers)
  );
  v1Router.use(
    "/groups",
    middleware.auth.authenticate,
    groupRoutes(controllers)
  );
  v1Router.use(
    "/savings-goals",
    middleware.auth.authenticate,
    savingsGoalsRoutes(controllers)
  );
  v1Router.use("/ai", middleware.auth.authenticate, aiRoutes(controllers));
  v1Router.use(
    "/subscription-tier",
    middleware.auth.authenticate,
    subscriptionRoutes(controllers, middleware)
  );
  v1Router.use(
    "/balance",
    middleware.auth.authenticate,
    balanceRoutes(controllers)
  );
  v1Router.use(
    "/invitations",
    middleware.auth.authenticate,
    invitationRoutes(controllers)
  );
  v1Router.use(
    "/financial-projections",
    middleware.auth.authenticate,
    financialProjectionsRoutes(controllers)
  );
  v1Router.use("/users", middleware.auth.authenticate, userRoutes(controllers));
  v1Router.use(
    "/recurring-transactions",
    middleware.auth.authenticate,
    recurringTransactionsRoutes(controllers)
  );

  // Admin routes with role check
  v1Router.use(
    "/admin",
    middleware.auth.authenticate,
    middleware.auth.requireRole("admin"),
    adminRoutes(controllers)
  );

  return v1Router;
};
