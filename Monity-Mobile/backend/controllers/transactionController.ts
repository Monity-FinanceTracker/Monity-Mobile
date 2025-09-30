import { Transaction } from "../models";
import { logger } from "../utils/logger";
import type { Request, Response, NextFunction } from "express";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    [key: string]: any;
  };
}

class TransactionController {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  async getAllTransactions(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    try {
      const transactions = await Transaction.getAll(userId);

      // Add type field based on typeId for frontend compatibility
      const transactionsWithType = transactions.map((transaction: any) => ({
        ...transaction,
        type:
          transaction.typeId === 1
            ? "expense"
            : transaction.typeId === 2
            ? "income"
            : "unknown",
      }));

      res.json({ success: true, data: transactionsWithType });
    } catch (error) {
      logger.error("Failed to get transactions for user", {
        userId,
        error: error as Error["message"],
      });
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch transactions" });
    }
  }

  async getRecentTransactions(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit as string) || 5;

    try {
      const transactions = await Transaction.getRecent(userId, limit);

      // Add type field based on typeId for frontend compatibility
      const transactionsWithType = transactions.map((transaction: any) => ({
        ...transaction,
        type:
          transaction.typeId === 1
            ? "expense"
            : transaction.typeId === 2
            ? "income"
            : "unknown",
      }));

      res.json({ success: true, data: transactionsWithType });
    } catch (error) {
      logger.error("Failed to get recent transactions for user", {
        userId,
        error: error as Error["message"],
      });
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch recent transactions" });
    }
  }

  async getTransactionById(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    const transactionId = req.params.id;
    try {
      const transaction = await Transaction.getById(transactionId, userId);
      if (!transaction) {
        return res
          .status(404)
          .json({ success: false, error: "Transaction not found" });
      }

      // Add type field based on typeId for frontend compatibility
      const transactionWithType = {
        ...transaction,
        type:
          transaction.typeId === 1
            ? "expense"
            : transaction.typeId === 2
            ? "income"
            : "unknown",
      };

      res.json({ success: true, data: transactionWithType });
    } catch (error) {
      logger.error("Failed to get transaction by ID", {
        userId,
        transactionId,
        error: error as Error["message"],
      });
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch transaction" });
    }
  }

  async createTransaction(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    const {
      description,
      amount,
      category,
      date,
      typeId,
      wasAISuggested,
      aiConfidence,
      suggestedCategory,
    } = req.body;

    if (!description || !amount || !category || !date || !typeId) {
      return res.status(400).json({
        message: "Description, amount, category, date, and typeId are required",
      });
    }

    try {
      const newTransaction = {
        userId,
        description,
        amount: parseFloat(amount),
        category,
        date,
        typeId,
      };

      const createdTransaction = await Transaction.create(newTransaction);

      // Handle AI feedback separately, should not block the main transaction flow
      if (wasAISuggested && suggestedCategory) {
        // This could be offloaded to a queue in a larger application
        const smartCategorizationService =
          new (require("../services/smartCategorizationService"))(
            this.supabase
          );
        smartCategorizationService
          .recordFeedback(
            userId,
            description,
            suggestedCategory,
            category,
            suggestedCategory === category,
            aiConfidence || 0.5,
            parseFloat(amount)
          )
          .catch((err: any) =>
            logger.error("Failed to record AI feedback", { error: err.message })
          );
      }

      // Add type field based on typeId for frontend compatibility
      const transactionWithType = {
        ...createdTransaction,
        type:
          createdTransaction.typeId === 1
            ? "expense"
            : createdTransaction.typeId === 2
            ? "income"
            : "unknown",
      };

      res.status(201).json({ success: true, data: transactionWithType });
    } catch (error) {
      logger.error("Failed to create transaction", {
        userId,
        error: error as Error["message"],
      });
      res
        .status(500)
        .json({ success: false, error: "Failed to create transaction" });
    }
  }

  async updateTransaction(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    const transactionId = req.params.id;
    const { description, amount, category, date, typeId } = req.body;

    try {
      const updatedTransaction = await Transaction.update(
        transactionId,
        userId,
        {
          description,
          amount,
          category,
          date,
          typeId,
        }
      );

      if (!updatedTransaction) {
        return res.status(404).json({
          success: false,
          error:
            "Transaction not found or you do not have permission to update it.",
        });
      }

      res.json({ success: true, data: updatedTransaction });
    } catch (error) {
      logger.error("Failed to update transaction", {
        userId,
        transactionId,
        error: error as Error["message"],
      });
      res
        .status(500)
        .json({ success: false, error: "Failed to update transaction" });
    }
  }

  async deleteTransaction(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    const transactionId = req.params.id;

    try {
      const deletedTransaction = await Transaction.delete(
        transactionId,
        userId
      );

      if (!deletedTransaction) {
        return res.status(404).json({
          success: false,
          error:
            "Transaction not found or you do not have permission to delete it.",
        });
      }

      res.json({ success: true, message: "Transaction deleted successfully" });
    } catch (error) {
      logger.error("Failed to delete transaction", {
        userId,
        transactionId,
        error: error as Error["message"],
      });
      res
        .status(500)
        .json({ success: false, error: "Failed to delete transaction" });
    }
  }
}

export default TransactionController;
