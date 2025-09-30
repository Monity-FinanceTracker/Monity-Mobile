import { logger } from "../utils/logger";
import { supabaseAdmin } from "../config/supabase";
import type { Request, Response, NextFunction } from "express";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    [key: string]: any;
  };
}

export default class SubscriptionController {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  async getSubscriptionTier(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    try {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("subscription_tier")
        .eq("id", userId)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        return res.status(404).json({ error: "User profile not found" });
      }

      res.json({ subscription_tier: data.subscription_tier });
    } catch (error) {
      logger.error("Failed to get subscription tier for user", {
        userId,
        error: error as Error["message"],
      });
      res.status(500).json({ error: "Failed to fetch subscription tier" });
    }
  }
}

// Export is already handled by export default class
