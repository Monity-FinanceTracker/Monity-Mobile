import { logger } from "../utils/logger";
import { supabase } from "../config/supabase";
import type { Request, Response, NextFunction } from "express";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    [key: string]: any;
  };
}

export default class UserController {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  async searchUsers(req: AuthenticatedRequest, res: Response) {
    const { q: query } = req.query;
    const userId = req.user.id;

    if (!query || (query as string).length < 2) {
      return res
        .status(400)
        .json({ error: "Query must be at least 2 characters long" });
    }

    try {
      const { data, error } = await this.supabase
        .from("profiles")
        .select("id, name, email")
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .neq("id", userId) // Don't include the current user
        .limit(10);

      if (error) {
        throw new Error(`Error searching users: ${error as Error["message"]}`);
      }

      res.json(data || []);
    } catch (error) {
      logger.error("Failed to search users", {
        userId,
        query,
        error: error as Error["message"],
      });
      res.status(500).json({ error: "Failed to search users" });
    }
  }
}

// Export is already handled by export default class
