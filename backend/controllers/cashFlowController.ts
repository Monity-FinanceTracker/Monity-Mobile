import { supabaseAdmin } from "../config/supabase";
import { logger } from "../utils/logger";
import ScheduledTransaction from "../models/ScheduledTransaction";
import ScheduledTransactionService from "../services/scheduledTransactionService";
import type { Request, Response, NextFunction } from "express";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    [key: string]: any;
  };
}

export default class CashFlowController {
  private supabase: any;
  private scheduledTransactionService: ScheduledTransactionService;

  constructor(supabase: any) {
    this.supabase = supabase;
    this.scheduledTransactionService = new ScheduledTransactionService();
  }

  /**
   * Get scheduled transactions for a user
   * GET /api/v1/cash-flow/scheduled-transactions
   */
  async getAllScheduledTransactions(
    req: AuthenticatedRequest,
    res: Response
  ) {
    try {
      const userId = req.user.id;
      const scheduledTransactions =
        await ScheduledTransaction.getAll(userId);
      return res.status(200).json(scheduledTransactions);
    } catch (error: any) {
      logger.error("Failed to get scheduled transactions", {
        userId: req.user?.id,
        error: error.message,
      });
      return res.status(500).json({
        error: "Failed to fetch scheduled transactions",
      });
    }
  }

  /**
   * Get a single scheduled transaction
   * GET /api/v1/cash-flow/scheduled-transactions/:id
   */
  async getScheduledTransactionById(
    req: AuthenticatedRequest,
    res: Response
  ) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const scheduledTransaction = await ScheduledTransaction.getById(
        id,
        userId
      );

      if (!scheduledTransaction) {
        return res.status(404).json({
          error: "Scheduled transaction not found",
        });
      }

      return res.status(200).json(scheduledTransaction);
    } catch (error: any) {
      logger.error("Failed to get scheduled transaction", {
        userId: req.user?.id,
        id: req.params.id,
        error: error.message,
      });
      return res.status(500).json({
        error: "Failed to fetch scheduled transaction",
      });
    }
  }

  /**
   * Create a scheduled transaction
   * POST /api/v1/cash-flow/scheduled-transactions
   */
  async createScheduledTransaction(
    req: AuthenticatedRequest,
    res: Response
  ) {
    try {
      const userId = req.user.id;
      const {
        description,
        amount,
        category,
        typeId,
        scheduled_date,
        recurrence_pattern = "once",
        recurrence_interval = 1,
        recurrence_end_date,
      } = req.body;

      // Validation
      if (!description || !amount || !category || !typeId) {
        return res.status(400).json({
          error:
            "Description, amount, category, and typeId are required",
        });
      }

      if (recurrence_pattern === "once" && !scheduled_date) {
        return res.status(400).json({
          error: "Scheduled date is required for one-time transactions",
        });
      }

      if (recurrence_pattern !== "once" && !scheduled_date) {
        return res.status(400).json({
          error:
            "Initial scheduled date is required for recurring transactions",
        });
      }

      // Validate that scheduled_date is in the future
      if (scheduled_date) {
        const scheduledDate = new Date(scheduled_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        scheduledDate.setHours(0, 0, 0, 0);

        if (scheduledDate <= today) {
          return res.status(400).json({
            error:
              "Scheduled transactions must be for future dates only. Please use the regular transaction feature for today or past dates.",
          });
        }
      }

      const scheduledTransactionData = {
        userId,
        description,
        amount: parseFloat(amount),
        category,
        typeId: parseInt(typeId),
        next_execution_date: scheduled_date,
        recurrence_pattern,
        recurrence_interval: parseInt(recurrence_interval) || 1,
        recurrence_end_date: recurrence_end_date || null,
        is_active: true,
      };

      const scheduledTransaction = await ScheduledTransaction.create(
        scheduledTransactionData
      );

      logger.info("Created scheduled transaction", {
        userId,
        scheduledTransactionId: scheduledTransaction.id,
      });

      return res.status(201).json(scheduledTransaction);
    } catch (error: any) {
      logger.error("Failed to create scheduled transaction", {
        userId: req.user?.id,
        error: error.message,
      });
      return res.status(500).json({
        error: "Failed to create scheduled transaction",
      });
    }
  }

  /**
   * Update a scheduled transaction
   * PUT /api/v1/cash-flow/scheduled-transactions/:id
   */
  async updateScheduledTransaction(
    req: AuthenticatedRequest,
    res: Response
  ) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const updates = req.body;

      const updatedTransaction = await ScheduledTransaction.update(
        id,
        userId,
        updates
      );

      if (!updatedTransaction) {
        return res.status(404).json({
          error:
            "Scheduled transaction not found or you do not have permission to update it",
        });
      }

      logger.info("Updated scheduled transaction", {
        userId,
        scheduledTransactionId: id,
      });

      return res.status(200).json(updatedTransaction);
    } catch (error: any) {
      logger.error("Failed to update scheduled transaction", {
        userId: req.user?.id,
        id: req.params.id,
        error: error.message,
      });
      return res.status(500).json({
        error: "Failed to update scheduled transaction",
      });
    }
  }

  /**
   * Delete a scheduled transaction
   * DELETE /api/v1/cash-flow/scheduled-transactions/:id
   */
  async deleteScheduledTransaction(
    req: AuthenticatedRequest,
    res: Response
  ) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const deletedTransaction = await ScheduledTransaction.delete(
        id,
        userId
      );

      if (!deletedTransaction) {
        return res.status(404).json({
          error:
            "Scheduled transaction not found or you do not have permission to delete it",
        });
      }

      logger.info("Deleted scheduled transaction", {
        userId,
        scheduledTransactionId: id,
      });

      return res.status(200).json({
        message: "Scheduled transaction deleted successfully",
      });
    } catch (error: any) {
      logger.error("Failed to delete scheduled transaction", {
        userId: req.user?.id,
        id: req.params.id,
        error: error.message,
      });
      return res.status(500).json({
        error: "Failed to delete scheduled transaction",
      });
    }
  }

  /**
   * Get calendar data with daily balances for a date range
   * GET /api/v1/cash-flow/calendar-data
   */
  async getCalendarData(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id;
      const { start_date, end_date } = req.query;

      if (!start_date || !end_date) {
        return res.status(400).json({
          error: "start_date and end_date are required",
        });
      }

      // Get all past transactions up to end_date
      const { data: pastTransactions, error: txnError } =
        await supabaseAdmin
          .from("transactions")
          .select("*")
          .eq("userId", userId)
          .lte("date", end_date as string);

      if (txnError) {
        throw txnError;
      }

      // Get scheduled transactions in date range
      const scheduledTransactions =
        await ScheduledTransaction.getByDateRange(
          userId,
          start_date as string,
          end_date as string
        );

      // Calculate daily balances
      const calendarData = this.calculateDailyBalances(
        pastTransactions || [],
        scheduledTransactions,
        start_date as string,
        end_date as string
      );

      return res.status(200).json(calendarData);
    } catch (error: any) {
      logger.error("Failed to get calendar data", {
        userId: req.user?.id,
        error: error.message,
      });
      return res.status(500).json({
        error: "Failed to fetch calendar data",
      });
    }
  }

  /**
   * Calculate daily balances for calendar view
   */
  private calculateDailyBalances(
    pastTransactions: any[],
    scheduledTransactions: any[],
    startDate: string,
    endDate: string
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dailyBalances: any[] = [];

    // Calculate initial balance from past transactions
    let currentBalance = 0;
    for (const txn of pastTransactions) {
      if (txn.typeId === 2) {
        // Income
        currentBalance += parseFloat(txn.amount) || 0;
      } else if (txn.typeId === 1) {
        // Expense
        currentBalance -= Math.abs(parseFloat(txn.amount) || 0);
      }
    }

    // Generate daily data
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split("T")[0];

      // Check for scheduled transactions on this date
      const scheduledForToday = scheduledTransactions.filter(
        (st) => st.next_execution_date === dateStr
      );

      let dayBalance = currentBalance;
      let dayIncome = 0;
      let dayExpenses = 0;

      for (const st of scheduledForToday) {
        if (st.typeId === 2) {
          // Income
          dayIncome += parseFloat(st.amount) || 0;
          dayBalance += parseFloat(st.amount) || 0;
        } else if (st.typeId === 1) {
          // Expense
          dayExpenses += Math.abs(parseFloat(st.amount) || 0);
          dayBalance -= Math.abs(parseFloat(st.amount) || 0);
        }
      }

      dailyBalances.push({
        date: dateStr,
        balance: dayBalance,
        income: dayIncome,
        expenses: dayExpenses,
        scheduledTransactions: scheduledForToday,
      });

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dailyBalances;
  }
}



