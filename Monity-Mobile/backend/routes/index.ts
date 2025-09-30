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
import budgetRoutes from "./budgets";
import financialProjectionsRoutes from "./financialProjections";
import userRoutes from "./users";
import billingRoutes from "./billing";

export default (controllers: any, middleware: any) => {
  // Version 1 of the API
  const v1Router = express.Router();

  // Apply general rate limiting to all v1 routes
  v1Router.use(middleware.rateLimiter.apiLimiter);

  // Auth routes have a stricter rate limit
  v1Router.use(
    "/auth",
    middleware.rateLimiter.authLimiter,
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
    subscriptionRoutes(controllers)
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
    "/budgets",
    middleware.auth.authenticate,
    budgetRoutes(controllers)
  );
  v1Router.use(
    "/financial-projections",
    middleware.auth.authenticate,
    financialProjectionsRoutes(controllers)
  );
  v1Router.use("/users", middleware.auth.authenticate, userRoutes(controllers));
  // v1Router.use(
  //   "/billing",
  //   middleware.auth.authenticate,
  //   billingRoutes(controllers)
  // ); // NEW - Commented out until billingController is implemented

  // Admin routes with role check
  v1Router.use(
    "/admin",
    middleware.auth.authenticate,
    middleware.auth.requireRole("admin"),
    adminRoutes(controllers)
  );

  return v1Router;
};
