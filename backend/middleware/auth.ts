import { supabase } from "../config";
import { logger } from "../utils/logger";
import type { Request, Response, NextFunction } from "express";

interface AuthenticatedRequest extends Request {
  user?: any;
  token?: string;
  supabase?: any;
}

const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authStartTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  logger.info(`🔐 [${requestId}] Auth middleware START`, {
    path: req.path,
    method: req.method,
    hasAuthHeader: !!req.headers.authorization,
    timestamp: new Date().toISOString(),
  });

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    logger.warn(`❌ [${requestId}] Auth failed: No token provided`, {
      path: req.path,
      authHeader: req.headers.authorization,
    });
    return res
      .status(401)
      .json({ success: false, message: "Authentication token is required." });
  }

  logger.info(`🔍 [${requestId}] Token found, validating with Supabase...`, {
    tokenLength: token.length,
    tokenPrefix: token.substring(0, 20) + '...',
  });

  try {
    const getUserStartTime = Date.now();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    const getUserDuration = Date.now() - getUserStartTime;

    logger.info(`⏱️  [${requestId}] Supabase getUser completed in ${getUserDuration}ms`, {
      hasUser: !!user,
      hasError: !!error,
      errorMessage: error?.message,
      userId: user?.id,
    });

    if (error || !user) {
      logger.warn(`❌ [${requestId}] Authentication failed: Invalid token`, {
        error: error?.message,
        errorCode: error?.code,
        errorStatus: error?.status,
        hasUser: !!user,
        duration: getUserDuration,
      });
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired token." });
    }

    req.user = user;
    req.token = token;

    // Note: The logic for creating a role-specific Supabase client
    // will be handled differently in the new architecture.
    // For now, we attach the main client.
    req.supabase = supabase;

    const totalDuration = Date.now() - authStartTime;
    logger.info(`✅ [${requestId}] Auth middleware SUCCESS (${totalDuration}ms)`, {
      userId: user.id,
      userEmail: user.email,
    });

    next();
  } catch (err) {
    const totalDuration = Date.now() - authStartTime;
    logger.error(`❌ [${requestId}] Error in authentication middleware (${totalDuration}ms)`, {
      error: err,
      errorMessage: err instanceof Error ? err.message : String(err),
      errorStack: err instanceof Error ? err.stack : undefined,
      path: req.path,
    });
    res
      .status(500)
      .json({
        success: false,
        message: "Internal server error during authentication.",
      });
  }
};

const checkPremium = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res
      .status(401)
      .json({
        success: false,
        message: "Authentication is required for this feature.",
      });
  }

  try {
    const { data: profile, error } = await req.supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", req.user.id)
      .single();

    if (error || !profile) {
      logger.warn("Could not retrieve user profile for premium check", {
        userId: req.user.id,
        error,
      });
      return res
        .status(404)
        .json({ success: false, message: "User profile not found." });
    }

    if (profile.subscription_tier !== "premium") {
      return res
        .status(403)
        .json({
          success: false,
          message:
            "Forbidden: A premium subscription is required for this feature.",
        });
    }

    next();
  } catch (err) {
    logger.error("Error in premium check middleware", {
      userId: req.user.id,
      error: err,
    });
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

const requireRole = (requiredRole: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication is required." });
    }

    const userRole = req.user.user_metadata?.role || "user";

    if (userRole !== requiredRole) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Forbidden: You do not have the required permissions.",
        });
    }

    next();
  };
};

export { authenticate, checkPremium, requireRole };
