import { asyncHandler } from "../utils/helpers";
import { supabaseAdmin } from "../config/supabase";
import { decryptObject, decrypt } from "../middleware/encryption";
import type { Request, Response, NextFunction } from "express";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    [key: string]: any;
  };
}

export default class BalanceController {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  getBalance = asyncHandler(async (req: any, res: Response) => {
    const userId = req.user.id;

    try {
      // Get all transactions for the user
      const { data: transactions, error } = await supabaseAdmin
        .from("transactions")
        .select("*")
        .eq("userId", userId);

      if (error) {
        throw error;
      }

      // Get all savings goals for the user to calculate allocated amounts
      const { data: savingsGoals, error: savingsError } = await supabaseAdmin
        .from("savings_goals")
        .select("*")
        .eq("user_id", userId);

      if (savingsError) {
        throw savingsError;
      }

      // Decrypt transactions
      const decryptedTransactions = transactions.map((transaction: any) => {
        const decrypted = decryptObject("transactions", transaction);
        return {
          ...decrypted,
          amount: parseFloat(decrypted.amount || 0),
        };
      });

      // Calculate income, expenses, and savings separately
      let income = 0;
      let expenses = 0;
      let savings = 0;

      decryptedTransactions.forEach((transaction: any) => {
        const amount = parseFloat(transaction.amount) || 0; // Ensure amount is a number
        console.log(
          `[Transaction] ID: ${transaction.id}, Type: ${transaction.typeId}, Amount: ${amount}, Description: ${transaction.description}`
        );

        if (transaction.typeId === 2) {
          // Income (positive values)
          income += Math.abs(amount); // Always use absolute value
          console.log(
            `[Income] Added ${Math.abs(amount)}, Total Income: ${income}`
          );
        } else if (transaction.typeId === 1) {
          // Expense (convert to positive for calculation)
          expenses += Math.abs(amount); // Always use absolute value
          console.log(
            `[Expense] Added ${Math.abs(amount)}, Total Expenses: ${expenses}`
          );
        } else if (transaction.typeId === 3) {
          // Savings (positive values)
          savings += Math.abs(amount); // Always use absolute value
          console.log(
            `[Savings] Added ${Math.abs(amount)}, Total Savings: ${savings}`
          );
        }
      });

      console.log(
        "[Balance Calculation] Income:",
        income,
        "Expenses:",
        expenses,
        "Savings:",
        savings
      );

      // Calculate total balance (income - expenses)
      const total = income - expenses;

      console.log("[Balance Calculation] Total:", total);

      // Calculate total allocated to savings goals
      let totalAllocated = 0;
      if (savingsGoals && savingsGoals.length > 0) {
        const decryptedGoals = savingsGoals.map((goal: any) =>
          decryptObject("savings_goals", goal)
        );
        totalAllocated = decryptedGoals.reduce((sum: any, goal: any) => {
          return sum + parseFloat(goal.current_amount || 0);
        }, 0);
      }

      console.log("[Balance Calculation] Total Allocated:", totalAllocated);

      // Available balance = total balance - allocated savings
      const availableBalance = total - totalAllocated;

      console.log("[Balance Calculation] Available Balance:", availableBalance);

      // Calculate change (for now, we'll use 0 as we don't have historical data)
      const change = 0;
      const changePercentage = 0;

      res.status(200).json({
        success: true,
        data: {
          total: total,
          income: income,
          expenses: expenses,
          change: change,
          changePercentage: changePercentage,
          availableBalance: availableBalance,
          allocatedSavings: totalAllocated,
        },
      });
    } catch (error) {
      console.error("Error calculating balance:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to calculate balance" });
    }
  });

  getMonthlyBalance = asyncHandler(async (req: any, res: Response) => {
    const userId = req.user.id;
    const { month, year } = req.params;

    // Validate parameters
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    if (
      !month ||
      !year ||
      isNaN(monthNum) ||
      isNaN(yearNum) ||
      monthNum < 1 ||
      monthNum > 12 ||
      yearNum < 2000 ||
      yearNum > 2100
    ) {
      console.error(`Invalid parameters: month=${month}, year=${year}`);
      return res.status(400).json({
        success: false,
        error: `Invalid month (${month}) or year (${year}) parameter`,
        received: { month, year },
      });
    }

    try {
      // Get transactions for specific month/year
      const startDate = `${year}-${month.padStart(2, "0")}-01`;
      const endDate = new Date(year, month, 0).toISOString().split("T")[0]; // Last day of month

      const { data: transactions, error } = await supabaseAdmin
        .from("transactions")
        .select("*")
        .eq("userId", userId)
        .gte("date", startDate)
        .lte("date", endDate);

      if (error) {
        throw error;
      }

      // Decrypt transactions
      const decryptedTransactions = transactions.map((transaction: any) => {
        const decrypted = decryptObject("transactions", transaction);
        return {
          ...decrypted,
          amount: parseFloat(decrypted.amount || 0),
        };
      });

      // Calculate monthly balance (income - expenses)
      let balance = 0;
      decryptedTransactions.forEach((transaction: any) => {
        const amount = transaction.amount; // Use original amount (negative for expenses, positive for income)
        if (transaction.typeId === 2) {
          // Income (positive values)
          balance += amount;
        } else if (transaction.typeId === 1) {
          // Expense (negative values)
          balance += amount; // Add negative amount (which subtracts from balance)
        }
        // Note: Savings are not included in balance calculation
      });

      res.status(200).json({ balance: balance });
    } catch (error) {
      console.error("Error calculating monthly balance:", error);
      res.status(500).json({ error: "Failed to calculate monthly balance" });
    }
  });

  getBalanceHistory = asyncHandler(async (req: any, res: Response) => {
    const userId = req.user.id;

    try {
      // Get all transactions for the user
      const { data: transactions, error } = await supabaseAdmin
        .from("transactions")
        .select("*")
        .eq("userId", userId)
        .order("date", { ascending: true });

      if (error) {
        throw error;
      }

      // Decrypt transactions
      const decryptedTransactions = transactions.map((transaction: any) => {
        const decrypted = decryptObject("transactions", transaction);
        return {
          ...decrypted,
          amount: parseFloat(decrypted.amount || 0),
        };
      });

      // Group by month and calculate running balance
      const monthlyBalances: { [key: string]: number } = {};
      let runningBalance = 0;

      decryptedTransactions.forEach((transaction: any) => {
        const date = new Date(transaction.date);
        const monthKey = `${date.getFullYear()}/${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        if (!monthlyBalances[monthKey]) {
          monthlyBalances[monthKey] = 0;
        }

        const amount = transaction.amount; // Use original amount (negative for expenses, positive for income)
        if (transaction.typeId === 2) {
          // Income (positive values)
          runningBalance += amount;
          monthlyBalances[monthKey] += amount;
        } else if (transaction.typeId === 1) {
          // Expense (negative values)
          runningBalance += amount; // Add negative amount (which subtracts from balance)
          monthlyBalances[monthKey] += amount; // Add negative amount (which subtracts from balance)
        }
        // Note: Savings are not included in balance calculation
      });

      const history = Object.entries(monthlyBalances).map(
        ([month, balance]) => ({
          month,
          balance,
        })
      );

      res.status(200).json(history);
    } catch (error) {
      console.error("Error getting balance history:", error);
      res.status(500).json({ error: "Failed to get balance history" });
    }
  });

  getMonths = asyncHandler(async (req: any, res: Response) => {
    const userId = req.user.id;

    try {
      // Get unique months from transactions
      const { data: transactions, error } = await supabaseAdmin
        .from("transactions")
        .select("date")
        .eq("userId", userId)
        .order("date", { ascending: true });

      if (error) {
        throw error;
      }

      // Extract unique months
      const months = [
        ...new Set(
          transactions
            .map((t: any) => {
              const date = new Date(t.date);
              const year = date.getFullYear();
              const month = date.getMonth() + 1;

              // Validate the date components
              if (
                isNaN(year) ||
                isNaN(month) ||
                year < 2000 ||
                year > 2100 ||
                month < 1 ||
                month > 12
              ) {
                console.warn("Invalid date found:", t.date, "parsed as:", {
                  year,
                  month,
                });
                return null;
              }

              return `${year}/${String(month).padStart(2, "0")}`;
            })
            .filter(Boolean)
        ),
      ]; // Remove null values

      res.status(200).json(months);
    } catch (error) {
      console.error("Error getting months:", error);
      res.status(500).json({ error: "Failed to get months" });
    }
  });

  getSavingsOverview = asyncHandler(async (req: any, res: Response) => {
    const userId = req.user.id;

    try {
      // Get all savings goals for the user
      const { data: savingsGoals, error } = await supabaseAdmin
        .from("savings_goals")
        .select("*")
        .eq("user_id", userId);

      if (error) {
        throw error;
      }

      if (!savingsGoals || savingsGoals.length === 0) {
        return res.status(200).json({
          totalAllocated: 0,
          totalTargets: 0,
          goals: [],
          progressPercentage: 0,
        });
      }

      // Decrypt and process goals
      const decryptedGoals = savingsGoals.map((goal: any) => {
        const decrypted = decryptObject("savings_goals", goal);
        const currentAmount = parseFloat(decrypted.current_amount || 0);
        const targetAmount = parseFloat(decrypted.target_amount || 0);
        const progress =
          targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;

        return {
          id: decrypted.id,
          goal_name: decrypted.goal_name,
          current_amount: currentAmount,
          target_amount: targetAmount,
          target_date: decrypted.target_date,
          progress: Math.min(progress, 100), // Cap at 100%
        };
      });

      // Calculate totals
      const totalAllocated = decryptedGoals.reduce(
        (sum: any, goal: any) => sum + goal.current_amount,
        0
      );
      const totalTargets = decryptedGoals.reduce(
        (sum: any, goal: any) => sum + goal.target_amount,
        0
      );
      const overallProgress =
        totalTargets > 0 ? (totalAllocated / totalTargets) * 100 : 0;

      res.status(200).json({
        totalAllocated,
        totalTargets,
        goals: decryptedGoals.slice(0, 3), // Show top 3 goals on dashboard
        progressPercentage: Math.min(overallProgress, 100),
        totalGoals: decryptedGoals.length,
      });
    } catch (error) {
      console.error("Error getting savings overview:", error);
      res.status(500).json({ error: "Failed to get savings overview" });
    }
  });
}

// Export is already handled by export default class
