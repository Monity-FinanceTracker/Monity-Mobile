import User from "../models/User";
import { logger } from "../utils/logger";
import FinancialHealthService from "../services/financialHealthService";
import { supabaseAdmin } from "../config/supabase";
import type { Request, Response, NextFunction } from "express";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    [key: string]: any;
  };
}

class AuthController {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  async register(req: Request, res: Response) {
    const { email, password, name } = req.body;
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: "user",
            name: name,
          },
        },
      });

      if (error) {
        logger.error("User registration failed", { error: error.message });
        return res.status(400).json({ 
          success: false, 
          error: error.message 
        });
      }

      if (data.user) {
        // Not waiting for this to complete to speed up response time
        User.createDefaultCategories(data.user.id).catch((err: any) =>
          logger.error("Failed to create default categories", {
            userId: data.user.id,
            error: err.message,
          })
        );
      }

      res.status(201).json({ 
        success: true, 
        data: { 
          user: data.user, 
          session: data.session 
        } 
      });
    } catch (error) {
      logger.error("An unexpected error occurred during registration", {
        error: error as Error["message"],
        stack: (error as Error).stack,
      });
      res.status(500).json({
        success: false,
        error: "Internal Server Error",
        details: (error as Error).message,
      });
    }
  }

  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ 
          success: false, 
          error: "Email and password are required." 
        });
    }

    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logger.warn("Login failed for user", {
          email: email,
          error: error as Error["message"],
        });
        return res.status(400).json({ 
          success: false, 
          error: "Invalid credentials" 
        });
      }

      res.json({ 
        success: true, 
        data: { 
          user: data.user, 
          session: data.session 
        } 
      });
    } catch (error) {
      logger.error("An unexpected error occurred during login", {
        email: email,
        error: error as Error["message"],
      });
      res.status(500).json({ 
        success: false, 
        error: "Internal Server Error" 
      });
    }
  }

  async getProfile(req: AuthenticatedRequest, res: Response) {
    // The user object is attached to the request by the auth middleware
    const userId = req.user.id;

    try {
      // Get user profile from profiles table using admin client to bypass RLS
      const { data: profile, error } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        // If profile doesn't exist, create one with basic info
        if (error.code === "PGRST116") {
          const { data: newProfile, error: createError } = await supabaseAdmin
            .from("profiles")
            .insert({
              id: userId,
              email: req.user.email,
              name: req.user.user_metadata?.name || "User",
              phone: req.user.user_metadata?.phone || null,
              cpf: req.user.user_metadata?.cpf || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (createError) {
            logger.error("Failed to create user profile", {
              userId,
              error: createError.message,
            });
            return res.status(500).json({ error: "Failed to create profile" });
          }

          const userData = {
            ...newProfile,
            subscriptionTier: newProfile.subscription_tier || "free",
          };

          logger.info("Profile created successfully", { userId });
          return res.json({ success: true, data: userData });
        }

        logger.error("Failed to fetch user profile", {
          userId,
          error: error.message,
        });
        return res.status(500).json({ error: "Failed to fetch profile" });
      }

      const userData = {
        ...profile,
        subscriptionTier: profile.subscription_tier || "free",
      };

      logger.info("Profile request successful", { userId });
      res.json({ success: true, data: userData });
    } catch (error) {
      logger.error("An unexpected error occurred while fetching profile", {
        userId,
        error: error as Error["message"],
      });
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getFinancialHealth(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;

    try {
      // Use the existing financial health service
      const financialHealthService = new FinancialHealthService(this.supabase);

      const healthData = await financialHealthService.getFinancialHealthScore(
        userId
      );

      // Get additional metrics for the user
      const thirtyDaysAgo = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();
      const { data: transactions, error: transactionsError } =
        await this.supabase
          .from("transactions")
          .select("amount, typeId, category, date")
          .eq("userId", userId)
          .gte("date", thirtyDaysAgo);

      if (transactionsError) {
        logger.error("Failed to get transactions for financial health", {
          userId,
          error: transactionsError as Error["message"],
        });
        return res
          .status(500)
          .json({ error: "Failed to fetch financial data." });
      }

      // Calculate detailed metrics
      const totalIncome = transactions
        .filter((t: any) => t.typeId === 2)
        .reduce((sum: any, t: any) => sum + t.amount, 0);
      const totalExpenses = transactions
        .filter((t: any) => t.typeId === 1)
        .reduce((sum: any, t: any) => sum + Math.abs(t.amount), 0);
      const savingsTransactions = transactions.filter(
        (t: any) => t.typeId === 3
      );

      const totalSavings = savingsTransactions.reduce((sum: any, t: any) => {
        if (t.category === "Make Investments") {
          return sum - t.amount;
        } else if (t.category === "Withdraw Investments") {
          return sum + t.amount;
        }
        return sum + t.amount;
      }, 0);

      // Calculate rates and ratios
      const savingsRate =
        totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;
      const expenseRatio =
        totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

      // Generate personalized recommendations
      const recommendations: any[] = [];

      if (savingsRate < 10) {
        recommendations.push({
          type: "savings",
          priority: "high",
          title: "Increase Your Savings Rate",
          description:
            "Aim to save at least 10-20% of your income for a healthy financial future.",
          actionable: "Consider setting up automatic transfers to savings.",
        });
      }

      if (expenseRatio > 80) {
        recommendations.push({
          type: "expenses",
          priority: "medium",
          title: "Review Your Expenses",
          description:
            "Your expense ratio is quite high. Look for areas to reduce spending.",
          actionable:
            "Review your largest expense categories and find savings opportunities.",
        });
      }

      if (totalSavings > 0 && savingsRate > 15) {
        recommendations.push({
          type: "investment",
          priority: "low",
          title: "Consider Investment Options",
          description:
            "You have good savings habits! Consider growing your money through investments.",
          actionable: "Explore low-risk investment options for better returns.",
        });
      }

      if (recommendations.length === 0) {
        recommendations.push({
          type: "positive",
          priority: "info",
          title: "Great Financial Habits!",
          description:
            "Keep up the excellent work with your financial management.",
          actionable:
            "Continue monitoring your progress and set new financial goals.",
        });
      }

      // Determine health category
      let healthCategory = "Poor";
      if (healthData.score >= 80) healthCategory = "Excellent";
      else if (healthData.score >= 60) healthCategory = "Good";
      else if (healthData.score >= 40) healthCategory = "Fair";

      res.json({
        score: Math.round(healthData.score),
        category: healthCategory,
        metrics: {
          savingsRate: parseFloat(savingsRate.toFixed(1)),
          expenseRatio: parseFloat(expenseRatio.toFixed(1)),
          totalIncome,
          totalExpenses,
          totalSavings,
          transactionCount: transactions.length,
        },
        recommendations,
        period: "30 days",
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(
        "An unexpected error occurred while fetching financial health",
        { userId, error: error as Error["message"] }
      );
      res.status(500).json({ error: "Failed to calculate financial health" });
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    const { name, email } = req.body;

    console.log("=".repeat(80));
    console.log("📝 UPDATE PROFILE - START");
    console.log("=".repeat(80));
    logger.info("📝 updateProfile called", {
      userId,
      body: { name, email },
      hasName: !!name,
      hasEmail: !!email,
      userObject: req.user,
    });
    console.log("📝 Request body:", JSON.stringify(req.body, null, 2));
    console.log("📝 User ID:", userId);

    // Validate input
    if (!name && !email) {
      logger.warn("❌ Validation failed: No name or email provided", { userId });
      return res.status(400).json({ 
        success: false,
        error: "At least one field (name or email) is required" 
      });
    }

    // Declare updateData outside try block so it's accessible in catch
    let updateData: any = {};
    
    try {
      // Build update object with only provided fields
      updateData = {};

      if (name !== undefined && name !== null && name.trim()) {
        updateData.name = name.trim();
        logger.info("✅ Name field will be updated", { name: name.trim() });
      } else {
        logger.info("⏭️ Name field skipped", { name, isUndefined: name === undefined, isNull: name === null });
      }

      if (email !== undefined && email !== null && email.trim()) {
        // Validate email format if provided
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          logger.warn("❌ Invalid email format", { email });
          return res.status(400).json({ 
            success: false,
            error: "Invalid email format" 
          });
        }
        updateData.email = email.trim();
        logger.info("✅ Email field will be updated", { email: email.trim() });
      } else {
        logger.info("⏭️ Email field skipped", { email, isUndefined: email === undefined, isNull: email === null });
      }

      // Ensure we have at least one field to update
      if (Object.keys(updateData).length === 0) {
        logger.warn("❌ No valid fields to update after processing", {
          userId,
          originalBody: { name, email },
        });
        return res.status(400).json({ 
          success: false,
          error: "No valid fields to update" 
        });
      }

      logger.info("🔄 Attempting to update profile in database", {
        userId,
        updateData,
        updateDataKeys: Object.keys(updateData),
      });

      // Update profile directly (no encryption needed for profiles table)
      // Note: updated_at will be handled by database triggers if configured
      console.log("🔄 Calling Supabase update...");
      console.log("Table: profiles");
      console.log("Where: id =", userId);
      console.log("Update data:", JSON.stringify(updateData, null, 2));
      
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .update(updateData)
        .eq("id", userId)
        .select("*")
        .single();
      
      console.log("Supabase response received");
      console.log("Has data:", !!data);
      console.log("Has error:", !!error);

      if (error) {
        console.log("=".repeat(80));
        console.log("❌ SUPABASE ERROR DETECTED");
        console.log("=".repeat(80));
        
        // Log all available error properties
        const errorInfo = {
          userId,
          errorMessage: error.message,
          errorCode: error.code,
          errorDetails: error.details,
          errorHint: error.hint,
          updateData,
          fullErrorObject: error,
        };
        
        console.error("Error object:", error);
        console.error("Error message:", error.message);
        console.error("Error code:", error.code);
        console.error("Error details:", error.details);
        console.error("Error hint:", error.hint);
        console.error("Update data:", updateData);
        
        logger.error("❌ Supabase error occurred", errorInfo);
        
        // Try to stringify error for complete details
        let fullErrorString = "Unknown error";
        try {
          fullErrorString = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
        } catch (e) {
          fullErrorString = String(error);
        }
        
        console.error("Full error string:", fullErrorString);
        logger.error("❌ Full error details:", { fullErrorString });
        
        const errorResponse = { 
          success: false,
          error: error.message || "Failed to update profile",
          errorCode: error.code || "UNKNOWN",
          errorDetails: error.details || error.hint || fullErrorString,
          debug: {
            updateData,
            userId,
          },
        };
        
        console.log("Sending error response:", JSON.stringify(errorResponse, null, 2));
        
        return res.status(500).json(errorResponse);
      }

      if (!data) {
        logger.error("❌ Profile not found after update", { userId });
        return res.status(404).json({ 
          success: false,
          error: "Profile not found" 
        });
      }

      logger.info("✅ Profile data retrieved from database", {
        userId,
        hasData: !!data,
        dataKeys: data ? Object.keys(data) : [],
      });

      // Format response to match frontend expectations (same as getProfile)
      const userData = {
        ...data,
        subscriptionTier: data.subscription_tier || "free",
      };

      logger.info("✅ Profile updated successfully", {
        userId,
        updatedFields: Object.keys(updateData),
        responseKeys: Object.keys(userData),
      });
      
      res.json({ success: true, data: userData });
    } catch (error: any) {
      console.log("=".repeat(80));
      console.log("❌ CATCH BLOCK - Unexpected error in updateProfile");
      console.log("=".repeat(80));
      console.error("Error object:", error);
      console.error("Error message:", error?.message);
      console.error("Error stack:", error?.stack);
      console.error("Error name:", error?.name);
      
      // Try to stringify the full error
      let errorString = "Unknown error";
      try {
        errorString = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
      } catch (e) {
        errorString = String(error);
      }
      console.error("Full error string:", errorString);
      
      logger.error("❌ Unexpected error in updateProfile", {
        userId,
        errorMessage: error?.message || "Unknown error",
        errorStack: error?.stack,
        errorName: error?.name,
        fullError: errorString,
      });
      
      // Make sure we haven't already sent a response
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false,
          error: error?.message || "Internal Server Error",
          errorDetails: errorString,
          errorCode: error?.code || "UNKNOWN_ERROR",
          debug: {
            userId,
            updateData: updateData || "N/A",
          },
        });
      } else {
        console.error("⚠️ Response already sent, cannot send error response");
      }
    }
    
    console.log("=".repeat(80));
    console.log("📝 UPDATE PROFILE - END");
    console.log("=".repeat(80));
  }

  async changePassword(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "New password must be at least 6 characters long" });
    }

    try {
      // First verify the current password by attempting to sign in
      const { data: userData, error: signInError } =
        await this.supabase.auth.signInWithPassword({
          email: req.user.email,
          password: currentPassword,
        });

      if (signInError) {
        logger.warn("Password change failed - invalid current password", {
          userId,
          error: signInError.message,
        });
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      // Update the password
      const { error: updateError } = await this.supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        logger.error("Failed to update password", {
          userId,
          error: updateError.message,
        });
        return res.status(500).json({ error: "Failed to update password" });
      }

      logger.info("Password updated successfully", { userId });
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      logger.error("An unexpected error occurred while changing password", {
        userId,
        error: error as Error["message"],
      });
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async deleteAccount(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password) {
      return res
        .status(400)
        .json({ error: "Password is required to delete account" });
    }

    try {
      // First verify the password by attempting to sign in
      const { data: userData, error: signInError } =
        await this.supabase.auth.signInWithPassword({
          email: req.user.email,
          password: password,
        });

      if (signInError) {
        logger.warn("Account deletion failed - invalid password", {
          userId,
          error: signInError.message,
        });
        return res.status(400).json({ error: "Password is incorrect" });
      }

      // Delete user data from profiles table first
      const { error: profileError } = await this.supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (profileError) {
        logger.error("Failed to delete user profile", {
          userId,
          error: profileError.message,
        });
        return res.status(500).json({ error: "Failed to delete account data" });
      }

      // Delete user from auth (this will cascade delete related data)
      const { error: authError } = await this.supabase.auth.admin.deleteUser(
        userId
      );

      if (authError) {
        logger.error("Failed to delete user from auth", {
          userId,
          error: authError.message,
        });
        return res.status(500).json({ error: "Failed to delete account" });
      }

      logger.info("Account deleted successfully", { userId });
      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      logger.error("An unexpected error occurred while deleting account", {
        userId,
        error: error as Error["message"],
      });
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}

export default AuthController;
