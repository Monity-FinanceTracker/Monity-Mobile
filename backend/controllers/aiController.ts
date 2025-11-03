import SmartCategorizationService from "../services/smartCategorizationService";
import AISchedulerService from "../services/aiSchedulerService";
import { logger } from "../utils/logger";
import type { Request, Response, NextFunction } from "express";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    [key: string]: any;
  };
}

export default class AIController {
  private supabase: any;
  private smartCategorizationService: any;
  private aiSchedulerService: any;

  constructor(supabase: any) {
    this.supabase = supabase;
    this.smartCategorizationService = new SmartCategorizationService(supabase);
    this.aiSchedulerService = new AISchedulerService();
  }

  async categorizeTransaction(req: AuthenticatedRequest, res: Response) {
    const { description, amount, transactionType } = req.body;
    const userId = req.user.id;

    if (!description) {
      return res
        .status(400)
        .json({ error: "Transaction description is required" });
    }

    try {
      const suggestions = await this.smartCategorizationService.suggestCategory(
        description,
        amount || 0,
        transactionType || 1,
        userId
      );

      res.json({
        success: true,
        suggestions: suggestions,
        description: description,
      });
    } catch (error) {
      logger.error("Failed to get category suggestions", {
        userId,
        description,
        error: error as Error["message"],
      });
      res.status(500).json({
        error: "Failed to get category suggestions",
        suggestions: [
          {
            category: "Uncategorized",
            confidence: 0.3,
            source: "fallback",
          },
        ],
      });
    }
  }

  async recordFeedback(req: AuthenticatedRequest, res: Response) {
    const {
      transactionDescription,
      suggestedCategory,
      actualCategory,
      wasAccepted,
      confidence,
      amount,
    } = req.body;
    const userId = req.user.id;

    if (!transactionDescription || !actualCategory) {
      return res.status(400).json({
        error: "Transaction description and actual category are required",
      });
    }

    try {
      await this.smartCategorizationService.recordFeedback(
        userId,
        transactionDescription,
        suggestedCategory || "None",
        actualCategory,
        wasAccepted || false,
        confidence || 0.5,
        amount
      );

      res.json({
        success: true,
        message: "Feedback recorded successfully",
      });
    } catch (error) {
      logger.error("Failed to record AI feedback", {
        userId,
        transactionDescription,
        error: error as Error["message"],
      });
      res.status(500).json({ error: "Failed to record feedback" });
    }
  }

  async getProjectedExpenses(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    try {
      const predictions = await this.aiSchedulerService.predictUpcomingBills(
        userId
      );
      res.json(predictions);
    } catch (error) {
      logger.error("Failed to get projected expenses", {
        userId,
        error: error as Error["message"],
      });
      res.status(500).json({ error: "Failed to get projected expenses" });
    }
  }

  async getAIStats(req: AuthenticatedRequest, res: Response) {
    res.json({
      message: "AI stats coming soon!",
      accuracy: 0.95,
      suggestions: 1000,
      feedback: 100,
    });
  }
}

// Export is already handled by export default class
