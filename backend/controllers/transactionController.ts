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
      // Get filters from query parameters
      const filters: {
        type?: "income" | "expense";
        categoryId?: string;
        startDate?: string;
        endDate?: string;
        search?: string;
      } = {};

      if (req.query.type) {
        filters.type = req.query.type as "income" | "expense";
      }
      if (req.query.categoryId) {
        filters.categoryId = req.query.categoryId as string;
      }
      if (req.query.startDate) {
        filters.startDate = req.query.startDate as string;
      }
      if (req.query.endDate) {
        filters.endDate = req.query.endDate as string;
      }
      if (req.query.search) {
        filters.search = req.query.search as string;
      }

      console.log("🔍 getAllTransactions - Query params:", req.query);
      console.log("🔍 getAllTransactions - Parsed filters:", filters);

      const transactions = await Transaction.getAll(userId, filters);

      // Add type field based on typeId for frontend compatibility
      // Also map is_favorite from database to isFavorite for frontend
      const transactionsWithType = transactions.map((transaction: any) => {
        // Explicitly check for true value (not just truthy, since false is also a valid value)
        const isFavoriteValue = transaction.is_favorite === true || transaction.is_favorite === "true" || transaction.is_favorite === 1 
          ? true 
          : (transaction.isFavorite === true || transaction.isFavorite === "true" || transaction.isFavorite === 1 ? true : false);
        
        return {
          ...transaction,
          type:
            transaction.typeId === 1
              ? "expense"
              : transaction.typeId === 2
              ? "income"
              : "unknown",
          isFavorite: isFavoriteValue,
          // Keep is_favorite for debugging
          is_favorite: transaction.is_favorite,
        };
      });

      // Debug log to check if favorites are being returned
      const favoritesCount = transactionsWithType.filter((t: any) => t.isFavorite === true).length;
      console.log("🔍 getAllTransactions - Favorites count:", favoritesCount, "out of", transactionsWithType.length);
      console.log("🔍 getAllTransactions - Filters applied:", filters);
      console.log("🔍 getAllTransactions - Transactions returned:", transactionsWithType.length);

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
      // Also map is_favorite from database to isFavorite for frontend
      const transactionsWithType = transactions.map((transaction: any) => ({
        ...transaction,
        type:
          transaction.typeId === 1
            ? "expense"
            : transaction.typeId === 2
            ? "income"
            : "unknown",
        isFavorite: transaction.is_favorite || transaction.isFavorite || false,
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
      // Also map is_favorite from database to isFavorite for frontend
      const transactionWithType = {
        ...transaction,
        type:
          transaction.typeId === 1
            ? "expense"
            : transaction.typeId === 2
            ? "income"
            : "unknown",
        isFavorite: transaction.is_favorite || transaction.isFavorite || false,
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
    
    // LOG FIRST THING - before any processing
    console.log("🔍🔍🔍 createTransaction START - Raw req.body:", {
      "req.body": JSON.stringify(req.body),
      "req.body.isFavorite": req.body.isFavorite,
      "req.body.is_favorite": (req.body as any).is_favorite,
      "typeof isFavorite": typeof req.body.isFavorite,
    });
    
    const {
      description,
      amount,
      category,
      categoryId,
      date,
      typeId,
      isFavorite,
      wasAISuggested,
      aiConfidence,
      suggestedCategory,
    } = req.body;

    // LOG after destructuring
    console.log("🔍🔍🔍 createTransaction - After destructuring:", {
      "isFavorite": isFavorite,
      "typeof": typeof isFavorite,
      "isUndefined": isFavorite === undefined,
      "isNull": isFavorite === null,
    });

    if (!description || !amount || !category || !date || !typeId) {
      return res.status(400).json({
        message: "Description, amount, category, date, and typeId are required",
      });
    }

    try {
      // Map isFavorite to is_favorite for database (Supabase uses snake_case)
      // Check both camelCase and snake_case in case it comes from different sources
      const rawIsFavorite = isFavorite !== undefined 
        ? isFavorite 
        : ((req.body as any).is_favorite !== undefined ? (req.body as any).is_favorite : false);
      
      // Convert to proper boolean - handle all possible truthy values
      // If explicitly false or undefined, set to false, otherwise check if it's truthy
      let isFavoriteValue: boolean;
      if (rawIsFavorite === false || rawIsFavorite === "false" || rawIsFavorite === 0 || rawIsFavorite === "0") {
        isFavoriteValue = false;
      } else if (rawIsFavorite === true || rawIsFavorite === "true" || rawIsFavorite === 1 || rawIsFavorite === "1") {
        isFavoriteValue = true;
      } else {
        // For undefined or null, default to false
        isFavoriteValue = false;
      }
      
      console.log("🔍 TransactionController.createTransaction - isFavorite debug:", {
        "req.body.isFavorite": req.body.isFavorite,
        "req.body.is_favorite": (req.body as any).is_favorite,
        "isFavorite param": isFavorite,
        "rawIsFavorite": rawIsFavorite,
        "typeof rawIsFavorite": typeof rawIsFavorite,
        "isFavoriteValue": isFavoriteValue,
        "typeof isFavoriteValue": typeof isFavoriteValue,
        "fullBody": JSON.stringify(req.body),
        userId,
      });

      // If categoryId is not provided, try to find it by category name
      let finalCategoryId = categoryId;
      if (!finalCategoryId && category) {
        try {
          const Category = require("../models/Category").default;
          const categories = await Category.findByUser(userId);
          const foundCategory = categories.find((cat: any) => cat.name === category);
          if (foundCategory) {
            finalCategoryId = foundCategory.id;
            console.log(`🔍 Found categoryId ${finalCategoryId} for category name "${category}"`);
          } else {
            console.log(`⚠️ CategoryId not found for category name "${category}", will be null`);
          }
        } catch (error) {
          console.error("⚠️ Error finding categoryId by name:", error);
          // Continue without categoryId - it's optional
        }
      }

      const newTransaction = {
        userId,
        description,
        amount: parseFloat(amount),
        category,
        categoryId: finalCategoryId, // Add categoryId to transaction
        date,
        typeId,
        is_favorite: isFavoriteValue, // Explicitly set to boolean true/false
      };

      console.log("🔍 TransactionController.createTransaction - newTransaction:", {
        newTransaction: JSON.stringify(newTransaction),
        hasIsFavorite: "is_favorite" in newTransaction,
        is_favorite_value: newTransaction.is_favorite,
        typeof_is_favorite: typeof newTransaction.is_favorite,
      });

      const createdTransaction = await Transaction.create(newTransaction);

      logger.info("Transaction created", {
        createdId: createdTransaction?.id,
        createdIsFavorite: createdTransaction?.is_favorite,
      });

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
      // Also map is_favorite from database to isFavorite for frontend
      const transactionWithType = {
        ...createdTransaction,
        type:
          createdTransaction.typeId === 1
            ? "expense"
            : createdTransaction.typeId === 2
            ? "income"
            : "unknown",
        isFavorite: createdTransaction.is_favorite || createdTransaction.isFavorite || false,
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

  async updateTransaction(req: AuthenticatedRequest, res: Response, next?: NextFunction) {
    const userId = req.user.id;
    const transactionId = req.params.id;
    
    console.log("🔍🔍🔍 updateTransaction START - Raw req.body:", {
      "req.body": JSON.stringify(req.body),
      "req.body.isFavorite": req.body.isFavorite,
      "typeof isFavorite": typeof req.body.isFavorite,
      transactionId,
      userId,
    });
    
    const { description, amount, category, date, typeId, isFavorite } = req.body;

    try {
      // Build updateData only with provided fields (exclude undefined)
      const updateData: any = {};

      // Only include fields that are actually provided (not undefined)
      if (description !== undefined) updateData.description = description;
      if (amount !== undefined) updateData.amount = amount;
      if (category !== undefined) updateData.category = category;
      if (date !== undefined) updateData.date = date;
      if (typeId !== undefined) updateData.typeId = typeId;

      // Only include is_favorite if it's provided (map to database column name)
      if (isFavorite !== undefined) {
        // Convert to proper boolean - handle all possible values
        if (isFavorite === false || isFavorite === "false" || isFavorite === 0 || isFavorite === "0") {
          updateData.is_favorite = false;
        } else if (isFavorite === true || isFavorite === "true" || isFavorite === 1 || isFavorite === "1") {
          updateData.is_favorite = true;
        } else {
          updateData.is_favorite = false;
        }
      }

      console.log("🔍 TransactionController.updateTransaction - updateData:", {
        updateData,
        updateDataKeys: Object.keys(updateData),
        "hasIsFavorite": "is_favorite" in updateData,
        "is_favorite_value": updateData.is_favorite,
      });

      // Check if there's anything to update
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          error: "No fields provided to update",
        });
      }

      const updatedTransaction = await Transaction.update(
        transactionId,
        userId,
        updateData
      );

      if (!updatedTransaction) {
        return res.status(404).json({
          success: false,
          error:
            "Transaction not found or you do not have permission to update it.",
        });
      }

      // Map is_favorite to isFavorite for frontend
      const transactionWithType = {
        ...updatedTransaction,
        isFavorite: updatedTransaction.is_favorite || updatedTransaction.isFavorite || false,
      };

      res.json({ success: true, data: transactionWithType });
    } catch (error) {
      logger.error("Failed to update transaction", {
        userId,
        transactionId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        requestBody: req.body,
      });
      
      // Log more details about the error
      console.error("❌ updateTransaction error:", {
        error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        requestBody: req.body,
        transactionId,
        userId,
      });
      
      res
        .status(500)
        .json({ 
          success: false, 
          error: "Failed to update transaction",
          details: error instanceof Error ? error.message : String(error),
        });
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
