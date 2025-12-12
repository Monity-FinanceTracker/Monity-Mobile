import { logger } from "../utils/logger";
import InvestmentCalculatorService from "../services/investmentCalculatorService";
import InvestmentCalculator from "../models/InvestmentCalculator";
import User from "../models/User";
import type { Request, Response, NextFunction } from "express";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    [key: string]: any;
  };
}

const FREE_TIER_MONTHLY_LIMIT = 3;

export default class InvestmentCalculatorController {
  private investmentCalculatorService: InvestmentCalculatorService;

  constructor() {
    this.investmentCalculatorService = new InvestmentCalculatorService();
  }

  /**
   * Calculate investment with compound interest
   * POST /api/v1/investment-calculator/calculate
   */
  async calculateInvestment(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const {
      initialInvestment,
      contributionAmount,
      contributionFrequency,
      annualInterestRate,
      goalDate,
      viewType = "monthly",
    } = req.body;

    try {
      // Validate input parameters
      const validation =
        this.investmentCalculatorService.validateParameters({
          initialInvestment,
          contributionAmount,
          contributionFrequency,
          annualInterestRate,
          goalDate,
        });

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
      }

      // Get user profile to check subscription tier
      const user = await User.getById(userId);
      const subscriptionTier = user?.subscription_tier || "free";

      // Check usage limit for free users
      if (subscriptionTier === "free") {
        const usage = await InvestmentCalculator.getMonthlyUsage(userId);

        if (usage.simulation_count >= FREE_TIER_MONTHLY_LIMIT) {
          return res.status(429).json({
            success: false,
            error: "Monthly simulation limit reached",
            message: `You've reached your monthly limit of ${FREE_TIER_MONTHLY_LIMIT} simulations. Upgrade to premium for unlimited simulations.`,
            limit: FREE_TIER_MONTHLY_LIMIT,
            used: usage.simulation_count,
            upgradeRequired: true,
          });
        }
      }

      // Perform calculation
      const calculation =
        this.investmentCalculatorService.calculateCompoundInterest({
          initialInvestment,
          contributionAmount,
          contributionFrequency,
          annualInterestRate,
          goalDate,
        });

      // Generate growth data for charting
      const growthData =
        this.investmentCalculatorService.generateGrowthData(
          {
            initialInvestment,
            contributionAmount,
            contributionFrequency,
            annualInterestRate,
            goalDate,
          },
          viewType
        );

      // Increment usage count for free users
      if (subscriptionTier === "free") {
        await InvestmentCalculator.incrementUsage(userId);
      }

      // Save simulation for premium users
      if (subscriptionTier === "premium") {
        await InvestmentCalculator.saveSimulation(userId, {
          initialInvestment,
          contributionAmount,
          contributionFrequency,
          annualInterestRate,
          goalDate,
          finalValue: calculation.finalValue,
          totalContributions: calculation.totalContributions,
          totalInterest: calculation.totalInterest,
          roiPercentage: calculation.roiPercentage,
          metadata: { viewType },
        });
      }

      // Get updated usage
      const updatedUsage = await InvestmentCalculator.getMonthlyUsage(userId);

      res.json({
        success: true,
        data: {
          summary: {
            finalValue: calculation.finalValue,
            totalContributions: calculation.totalContributions,
            totalInterest: calculation.totalInterest,
            roiPercentage: calculation.roiPercentage,
            years: calculation.years,
          },
          growthData,
          usage: {
            simulationsUsed: updatedUsage.simulation_count,
            simulationsLimit:
              subscriptionTier === "free"
                ? FREE_TIER_MONTHLY_LIMIT
                : null,
            isPremium: subscriptionTier === "premium",
          },
        },
      });
    } catch (error: any) {
      logger.error("Error in investment calculator calculateInvestment", {
        userId,
        error: error.message,
        stack: error.stack,
      });

      res.status(500).json({
        success: false,
        error: error.message || "Failed to calculate investment",
      });
    }
  }

  /**
   * Get current month usage statistics
   * GET /api/v1/investment-calculator/usage
   */
  async getUsage(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    try {
      const usage = await InvestmentCalculator.getMonthlyUsage(userId);
      const user = await User.getById(userId);
      const subscriptionTier = user?.subscription_tier || "free";

      res.json({
        success: true,
        data: {
          simulationsUsed: usage.simulation_count || 0,
          simulationsLimit:
            subscriptionTier === "free" ? FREE_TIER_MONTHLY_LIMIT : null,
          isPremium: subscriptionTier === "premium",
        },
      });
    } catch (error: any) {
      logger.error("Error in investment calculator getUsage", {
        userId,
        error: error.message,
      });

      res.status(500).json({
        success: false,
        error: error.message || "Failed to get usage",
      });
    }
  }

  /**
   * Get saved simulations (premium only)
   * GET /api/v1/investment-calculator/simulations
   */
  async getSimulations(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    try {
      const user = await User.getById(userId);
      const subscriptionTier = user?.subscription_tier || "free";

      if (subscriptionTier !== "premium") {
        return res.status(403).json({
          success: false,
          error: "Premium feature only",
        });
      }

      const simulations = await InvestmentCalculator.getSimulations(userId);

      res.json({
        success: true,
        data: simulations,
      });
    } catch (error: any) {
      logger.error("Error in investment calculator getSimulations", {
        userId,
        error: error.message,
      });

      res.status(500).json({
        success: false,
        error: error.message || "Failed to get simulations",
      });
    }
  }

  /**
   * Delete a simulation (premium only)
   * DELETE /api/v1/investment-calculator/simulations/:id
   */
  async deleteSimulation(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    try {
      const user = await User.getById(userId);
      const subscriptionTier = user?.subscription_tier || "free";

      if (subscriptionTier !== "premium") {
        return res.status(403).json({
          success: false,
          error: "Premium feature only",
        });
      }

      await InvestmentCalculator.deleteSimulation(id, userId);

      res.json({
        success: true,
        message: "Simulation deleted successfully",
      });
    } catch (error: any) {
      logger.error("Error in investment calculator deleteSimulation", {
        userId,
        simulationId: id,
        error: error.message,
      });

      res.status(500).json({
        success: false,
        error: error.message || "Failed to delete simulation",
      });
    }
  }
}


