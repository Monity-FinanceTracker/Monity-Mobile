import { Budget } from "../models";
import { logger } from "../utils/logger";
import type { Request, Response, NextFunction } from "express";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    [key: string]: any;
  };
}

export default class BudgetController {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  async getAllBudgets(req: AuthenticatedRequest, res: Response) {
    try {
      const { data: budgets, error } = await this.supabase
        .from("budgets")
        .select(
          `
          *,
          categories!inner(
            id,
            name,
            color,
            icon,
            typeId
          )
        `
        )
        .eq("userId", req.user.id);

      if (error) {
        throw error;
      }

      // Calculate spent amounts for each budget
      const budgetsWithSpentAmounts = await Promise.all(
        budgets.map(async (budget: any) => {
          // Get transactions for this category in the current month/year
          const currentDate = new Date();
          const month = budget.month || currentDate.getMonth() + 1;
          const year = budget.year || currentDate.getFullYear();

          const startDate = new Date(year, month - 1, 1);
          const endDate = new Date(year, month, 0, 23, 59, 59);

          const { data: transactions, error: transactionError } =
            await this.supabase
              .from("transactions")
              .select("amount")
              .eq("userId", req.user.id)
              .eq("category", budget.categories.name)
              .eq("typeId", 1) // Only expense transactions
              .gte("date", startDate.toISOString())
              .lte("date", endDate.toISOString());

          if (transactionError) {
            logger.warn("Error fetching transactions for budget", {
              budgetId: budget.id,
              error: transactionError.message,
            });
            return {
              ...budget,
              spentAmount: 0,
              transactions: 0,
            };
          }

          const spentAmount =
            transactions?.reduce((sum: number, transaction: any) => {
              return sum + Math.abs(transaction.amount); // Convert negative amounts to positive
            }, 0) || 0;

          return {
            ...budget,
            budgetAmount: budget.amount, // Map amount to budgetAmount
            spentAmount: Number(spentAmount.toFixed(2)),
            transactions: transactions?.length || 0,
            category: budget.categories,
          };
        })
      );

      res.json({
        success: true,
        data: budgetsWithSpentAmounts,
      });
    } catch (error) {
      logger.error("Failed to get budgets", {
        userId: req.user.id,
        error: error as Error["message"],
      });
      res.status(500).json({
        success: false,
        error: "Failed to fetch budgets",
      });
    }
  }

  async createBudget(req: AuthenticatedRequest, res: Response) {
    try {
      console.log("=== BUDGET CREATION DEBUG ===");
      console.log("Request body:", req.body);
      console.log("User ID:", req.user.id);

      const budgetData = { ...req.body, userId: req.user.id };

      // Handle legacy frontend that sends startDate instead of month
      if (budgetData.startDate && !budgetData.month) {
        budgetData.month = budgetData.startDate;
      }

      // Ensure month field is present (required by database)
      if (!budgetData.month) {
        budgetData.month = new Date().toISOString().split("T")[0];
      }

      // Validate required fields
      if (
        !budgetData.name ||
        !budgetData.budgetAmount ||
        !budgetData.categoryId
      ) {
        return res.status(400).json({
          error:
            "Missing required fields: name, budgetAmount, and categoryId are required",
        });
      }

      // Map budgetAmount to amount for database compatibility
      const dbBudgetData = {
        ...budgetData,
        amount: budgetData.budgetAmount,
      };
      delete dbBudgetData.budgetAmount;

      console.log("Budget data to create:", dbBudgetData);

      const { data: newBudget, error } = await this.supabase
        .from("budgets")
        .insert(dbBudgetData)
        .select();

      if (error) {
        throw error;
      }

      console.log("=== BUDGET CREATED SUCCESSFULLY ===");
      // Map amount back to budgetAmount for frontend compatibility
      const responseData = newBudget.map((budget: any) => ({
        ...budget,
        budgetAmount: budget.amount,
        spentAmount: 0, // New budget starts with 0 spent
        transactions: 0,
      }));
      res.status(201).json({
        success: true,
        data: responseData[0], // Return single budget object
      });
    } catch (error) {
      console.error("=== BUDGET CREATION ERROR ===");
      console.error("Error details:", error);
      logger.error("Failed to create budget", {
        userId: req.user.id,
        error: error as Error["message"],
      });
      res.status(500).json({
        success: false,
        error: "Failed to create budget",
      });
    }
  }

  async updateBudget(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { data: updatedBudget, error } = await this.supabase
        .from("budgets")
        .update(req.body)
        .eq("id", id)
        .eq("userId", req.user.id)
        .select();

      if (error) {
        throw error;
      }

      if (!updatedBudget || updatedBudget.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Budget not found",
        });
      }
      res.json({
        success: true,
        data: updatedBudget[0],
      });
    } catch (error) {
      logger.error("Failed to update budget", {
        userId: req.user.id,
        error: error as Error["message"],
      });
      res.status(500).json({
        success: false,
        error: "Failed to update budget",
      });
    }
  }

  async deleteBudget(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { error } = await this.supabase
        .from("budgets")
        .delete()
        .eq("id", id)
        .eq("userId", req.user.id);

      if (error) {
        throw error;
      }

      res.status(200).json({
        success: true,
        message: "Budget deleted successfully",
      });
    } catch (error) {
      logger.error("Failed to delete budget", {
        userId: req.user.id,
        error: error as Error["message"],
      });
      res.status(500).json({
        success: false,
        error: "Failed to delete budget",
      });
    }
  }
}

// Export is already handled by export default class
