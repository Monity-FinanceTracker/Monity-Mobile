import { Category } from "../models";
import { logger } from "../utils/logger";
import { supabaseAdmin } from "../config";
import type { Request, Response, NextFunction } from "express";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    [key: string]: any;
  };
}

export default class CategoryController {
  async getAllCategories(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    try {
      const categories = await Category.findByUser(userId);

      const categoriesWithCounts = await Promise.all(
        categories.map(async (category: any) => {
          // Get transaction count and total spent amount
          // Use categoryId instead of category name to match transactions
          const { data: transactions, error } = await supabaseAdmin
            .from("transactions")
            .select("amount")
            .eq("userId", userId)
            .eq("categoryId", category.id);

          if (error) {
            logger.warn("Error fetching transactions for category", {
              categoryId: category.id,
              categoryName: category.name,
              error: (error as Error).message,
            });
            return { ...category, transactionCount: 0, totalSpent: 0 };
          }

          const transactionCount = transactions?.length || 0;
          const totalSpent =
            transactions?.reduce((sum: number, transaction: any) => {
              // Parse amount to number (it might be stored as string)
              const amount = typeof transaction.amount === 'string' 
                ? parseFloat(transaction.amount) 
                : transaction.amount || 0;
              // For expenses, amount is negative, so we take absolute value
              // For income, amount is positive
              return sum + Math.abs(amount);
            }, 0) || 0;

          return {
            ...category,
            transactionCount,
            totalSpent: Number(totalSpent.toFixed(2)),
          };
        })
      );

      console.log("✅ Categories returned:", categoriesWithCounts.length);
      res.json({ success: true, data: categoriesWithCounts });
    } catch (error) {
      logger.error("Failed to get categories for user", {
        userId,
        error: (error as Error).message,
      });
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  }

  async createCategory(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    const { name, typeId, color, icon, metadata } = req.body;

    if (!name || !typeId) {
      return res
        .status(400)
        .json({ message: "Category name and type are required" });
    }

    try {
      const newCategory = {
        name,
        typeId,
        userId: userId,
        color: color || "#01C38D",
        icon: icon || "📦",
        metadata: metadata || {}, // Support metadata for internationalization
      };

      const createdCategory = await Category.create(newCategory);
      res.status(201).json(createdCategory);
    } catch (error) {
      logger.error("Failed to create category", {
        userId,
        error: (error as Error).message,
      });
      res.status(500).json({ error: "Failed to create category" });
    }
  }

  async updateCategory(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    const categoryId = req.params.id;
    const { name, typeId, color, icon } = req.body;

    try {
      const updatedCategory = await Category.update(categoryId, userId, {
        name,
        typeId,
        color,
        icon,
      });

      if (!updatedCategory) {
        return res.status(404).json({
          error:
            "Category not found or you do not have permission to update it.",
        });
      }

      res.json(updatedCategory);
    } catch (error) {
      logger.error("Failed to update category", {
        userId,
        categoryId,
        error: (error as Error).message,
      });
      res.status(500).json({ error: "Failed to update category" });
    }
  }

  async deleteCategory(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    const categoryId = req.params.id;

    try {
      const deletedCategory = await Category.delete(categoryId, userId);

      if (!deletedCategory) {
        return res.status(404).json({
          error:
            "Category not found or you do not have permission to delete it.",
        });
      }

      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      logger.error("Failed to delete category", {
        userId,
        categoryId,
        error: (error as Error).message,
      });
      res.status(500).json({ error: "Failed to delete category" });
    }
  }
}

module.exports = CategoryController;
