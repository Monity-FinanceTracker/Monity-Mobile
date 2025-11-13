import { RecurringTransaction } from "../models";
import { logger } from "../utils/logger";
import type { Request, Response } from "express";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    [key: string]: any;
  };
}

class RecurringTransactionController {
  async getAll(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    try {
      const recurringTransactions = await RecurringTransaction.getAll(userId);

      // Add type field based on typeId for frontend compatibility
      const transactionsWithType = recurringTransactions.map((transaction: any) => ({
        ...transaction,
        type: transaction.typeId === 1 ? "expense" : transaction.typeId === 2 ? "income" : "unknown",
        isFavorite: transaction.is_favorite || false,
      }));

      res.json({ success: true, data: transactionsWithType });
    } catch (error) {
      logger.error("Failed to get recurring transactions for user", {
        userId,
        error: error as Error["message"],
      });
      res.status(500).json({
        success: false,
        error: "Failed to fetch recurring transactions",
      });
    }
  }

  async getById(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    const recurringTransactionId = req.params.id;
    try {
      const recurringTransaction = await RecurringTransaction.getById(
        recurringTransactionId,
        userId
      );
      if (!recurringTransaction) {
        return res.status(404).json({
          success: false,
          error: "Recurring transaction not found",
        });
      }

      // Add type field based on typeId for frontend compatibility
      const transactionWithType = {
        ...recurringTransaction,
        type:
          recurringTransaction.typeId === 1
            ? "expense"
            : recurringTransaction.typeId === 2
            ? "income"
            : "unknown",
        isFavorite: recurringTransaction.is_favorite || false,
      };

      res.json({ success: true, data: transactionWithType });
    } catch (error) {
      logger.error("Failed to get recurring transaction by ID", {
        userId,
        recurringTransactionId,
        error: error as Error["message"],
      });
      res.status(500).json({
        success: false,
        error: "Failed to fetch recurring transaction",
      });
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;

    const {
      description,
      amount,
      category,
      categoryId,
      typeId,
      recurrenceDay,
      isFavorite,
      frequency,
    } = req.body;

    if (!description || !amount || !category || !typeId || !recurrenceDay) {
      return res.status(400).json({
        success: false,
        error: "Description, amount, category, typeId, and recurrenceDay are required",
      });
    }

    // Validate recurrenceDay
    if (recurrenceDay < 1 || recurrenceDay > 31) {
      return res.status(400).json({
        success: false,
        error: "recurrenceDay must be between 1 and 31",
      });
    }

    try {
      // If categoryId is not provided, try to find it by category name
      let finalCategoryId = categoryId;
      if (!finalCategoryId && category) {
        try {
          const Category = require("../models/Category").default;
          const categories = await Category.findByUser(userId);
          const foundCategory = categories.find((cat: any) => cat.name === category);
          if (foundCategory) {
            finalCategoryId = foundCategory.id;
          }
        } catch (error) {
          console.error("⚠️ Error finding categoryId by name:", error);
        }
      }

      // For expenses (typeId === 1), store as negative value
      // For income (typeId === 2), store as positive value
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount)) {
        return res.status(400).json({
          success: false,
          error: "Invalid amount value",
        });
      }
      const finalAmount = typeId === 1 ? -Math.abs(numericAmount) : Math.abs(numericAmount);

      const parsedRecurrenceDay = parseInt(recurrenceDay);
      if (isNaN(parsedRecurrenceDay)) {
        return res.status(400).json({
          success: false,
          error: "Invalid recurrenceDay value",
        });
      }

      const parsedTypeId = parseInt(typeId);
      if (isNaN(parsedTypeId) || (parsedTypeId !== 1 && parsedTypeId !== 2)) {
        return res.status(400).json({
          success: false,
          error: "Invalid typeId value. Must be 1 (expense) or 2 (income)",
        });
      }

      const newRecurringTransaction = {
        userId,
        description: String(description).trim(),
        amount: finalAmount,
        category: String(category).trim(),
        categoryId: finalCategoryId || null,
        typeId: parsedTypeId,
        recurrenceDay: parsedRecurrenceDay,
        is_favorite: isFavorite === true,
        frequency: frequency || 'monthly',
      };

      console.log("🔍 RecurringTransactionController.create - Prepared data:", {
        userId,
        description: newRecurringTransaction.description,
        amount: newRecurringTransaction.amount,
        category: newRecurringTransaction.category,
        categoryId: newRecurringTransaction.categoryId,
        typeId: newRecurringTransaction.typeId,
        recurrenceDay: newRecurringTransaction.recurrenceDay,
        is_favorite: newRecurringTransaction.is_favorite,
      });

      const createdRecurringTransaction = await RecurringTransaction.create(
        newRecurringTransaction
      );

      logger.info("Recurring transaction created", {
        createdId: createdRecurringTransaction?.id,
      });

      // Add type field based on typeId for frontend compatibility
      const transactionWithType = {
        ...createdRecurringTransaction,
        type:
          createdRecurringTransaction.typeId === 1
            ? "expense"
            : createdRecurringTransaction.typeId === 2
            ? "income"
            : "unknown",
        isFavorite: createdRecurringTransaction.is_favorite || false,
      };

      res.status(201).json({ success: true, data: transactionWithType });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("Failed to create recurring transaction", {
        userId,
        error: errorMessage,
        errorDetails: error,
      });
      res.status(500).json({
        success: false,
        error: errorMessage || "Failed to create recurring transaction",
      });
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    const recurringTransactionId = req.params.id;

    const {
      description,
      amount,
      category,
      categoryId,
      typeId,
      recurrenceDay,
      isFavorite,
    } = req.body;

    try {
      const updateData: any = {};

      if (description !== undefined) updateData.description = description;
      if (amount !== undefined) updateData.amount = amount;
      if (category !== undefined) updateData.category = category;
      if (categoryId !== undefined) updateData.categoryId = categoryId;
      if (typeId !== undefined) updateData.typeId = typeId;
      if (recurrenceDay !== undefined) {
        if (recurrenceDay < 1 || recurrenceDay > 31) {
          return res.status(400).json({
            success: false,
            error: "recurrenceDay must be between 1 and 31",
          });
        }
        updateData.recurrenceDay = parseInt(recurrenceDay);
      }
      if (isFavorite !== undefined) {
        updateData.is_favorite = isFavorite === true;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          error: "No fields provided to update",
        });
      }

      const updatedRecurringTransaction = await RecurringTransaction.update(
        recurringTransactionId,
        userId,
        updateData
      );

      if (!updatedRecurringTransaction) {
        return res.status(404).json({
          success: false,
          error:
            "Recurring transaction not found or you do not have permission to update it.",
        });
      }

      // Add type field based on typeId for frontend compatibility
      const transactionWithType = {
        ...updatedRecurringTransaction,
        type:
          updatedRecurringTransaction.typeId === 1
            ? "expense"
            : updatedRecurringTransaction.typeId === 2
            ? "income"
            : "unknown",
        isFavorite: updatedRecurringTransaction.is_favorite || false,
      };

      res.json({ success: true, data: transactionWithType });
    } catch (error) {
      logger.error("Failed to update recurring transaction", {
        userId,
        recurringTransactionId,
        error: error as Error["message"],
      });
      res.status(500).json({
        success: false,
        error: "Failed to update recurring transaction",
      });
    }
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    const recurringTransactionId = req.params.id;

    try {
      const deletedRecurringTransaction = await RecurringTransaction.delete(
        recurringTransactionId,
        userId
      );

      if (!deletedRecurringTransaction) {
        return res.status(404).json({
          success: false,
          error:
            "Recurring transaction not found or you do not have permission to delete it.",
        });
      }

      res.json({
        success: true,
        message: "Recurring transaction deleted successfully",
      });
    } catch (error) {
      logger.error("Failed to delete recurring transaction", {
        userId,
        recurringTransactionId,
        error: error as Error["message"],
      });
      res.status(500).json({
        success: false,
        error: "Failed to delete recurring transaction",
      });
    }
  }
}

export default RecurringTransactionController;

