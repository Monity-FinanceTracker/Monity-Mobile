import { supabaseAdmin } from "../config/supabase";
import { logger } from "../utils/logger";
import type { Request, Response, NextFunction } from "express";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    [key: string]: any;
  };
}

/**
 * Check actual completion status by querying user data
 */
async function checkActualCompletionStatus(userId: string) {
  const actualStatus = {
    create_account: true, // Always true if user exists
    add_first_transaction: false,
    set_up_budget: false,
    create_savings_goal: false,
    explore_ai_categorization: false,
    invite_to_group: false,
    download_report: false, // Manual - keep as false, user must mark manually
  };

  try {
    // Check if user has any transactions
    const { data: transactions, error: transactionsError } = await supabaseAdmin
      .from("transactions")
      .select("id")
      .eq("userId", userId)
      .limit(1);

    if (!transactionsError && transactions && transactions.length > 0) {
      actualStatus.add_first_transaction = true;
    }

    // Check if user has any budgets
    const { data: budgets, error: budgetsError } = await supabaseAdmin
      .from("budgets")
      .select("id")
      .eq("userId", userId)
      .limit(1);

    if (!budgetsError && budgets && budgets.length > 0) {
      actualStatus.set_up_budget = true;
    }

    // Check if user has any savings goals
    const { data: savingsGoals, error: savingsGoalsError } = await supabaseAdmin
      .from("savings_goals")
      .select("id")
      .eq("user_id", userId)
      .limit(1);

    if (!savingsGoalsError && savingsGoals && savingsGoals.length > 0) {
      actualStatus.create_savings_goal = true;
    }

    // Check if user has used AI categorization
    const { data: aiCategorization, error: aiCategorizationError } =
      await supabaseAdmin
        .from("categorization_feedback")
        .select("id")
        .eq("user_id", userId)
        .limit(1);

    if (!aiCategorizationError && aiCategorization && aiCategorization.length > 0) {
      actualStatus.explore_ai_categorization = true;
    } else {
      // Fallback: Check if user has used AI chat messages
      const { data: aiMessages, error: aiMessagesError } = await supabaseAdmin
        .from("ai_chat_messages")
        .select("id")
        .eq("userId", userId)
        .limit(1);

      if (!aiMessagesError && aiMessages && aiMessages.length > 0) {
        actualStatus.explore_ai_categorization = true;
      }
    }

    // Check if user is in any groups (as member or creator)
    const { data: groupMembers, error: groupMembersError } = await supabaseAdmin
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId)
      .limit(1);

    if (!groupMembersError && groupMembers && groupMembers.length > 0) {
      actualStatus.invite_to_group = true;
    }

    // Also check if user created any groups
    const { data: createdGroups, error: createdGroupsError } = await supabaseAdmin
      .from("groups")
      .select("id")
      .eq("created_by", userId)
      .limit(1);

    if (!createdGroupsError && createdGroups && createdGroups.length > 0) {
      actualStatus.invite_to_group = true;
    }
  } catch (error: any) {
    logger.error("Error checking actual completion status", {
      userId,
      error: error.message,
    });
  }

  return actualStatus;
}

export default class OnboardingController {
  /**
   * Get onboarding status and progress for a user
   * GET /api/v1/onboarding/progress
   */
  async getOnboardingProgress(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id;

      // Try to get onboarding record
      const { data: onboarding, error: fetchError } = await supabaseAdmin
        .from("user_onboarding")
        .select("*")
        .eq("user_id", userId)
        .single();

      // If no record exists, create one
      let onboardingData = onboarding;
      if (fetchError && fetchError.code === "PGRST116") {
        const { data: newOnboarding, error: createError } = await supabaseAdmin
          .from("user_onboarding")
          .insert({
            user_id: userId,
            onboarding_completed: false,
            current_step: 1,
            steps_completed: [],
            checklist_progress: {},
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }
        onboardingData = newOnboarding;
      } else if (fetchError) {
        throw fetchError;
      }

      // Get actual completion status by checking user data
      const actualStatus = await checkActualCompletionStatus(userId);

      // Remove manual items from actualStatus
      const { download_report, ...autoDetectableStatus } = actualStatus;

      // Merge actual status with stored progress
      const storedProgress = onboardingData?.checklist_progress || {};
      const mergedProgress = {
        ...autoDetectableStatus,
        ...storedProgress,
      };

      // Update database if there are changes
      const hasChanges = Object.keys(actualStatus).some((key) => {
        if (key === "download_report") return false;
        return mergedProgress[key] !== storedProgress[key];
      });

      if (hasChanges && onboardingData) {
        await supabaseAdmin
          .from("user_onboarding")
          .update({
            checklist_progress: mergedProgress,
          })
          .eq("user_id", userId);
      }

      return res.status(200).json({
        success: true,
        data: {
          ...onboardingData,
          checklist_progress: mergedProgress,
        },
      });
    } catch (error: any) {
      logger.error("Error getting onboarding progress", {
        userId: req.user?.id,
        error: error.message,
      });
      return res.status(500).json({
        success: false,
        message: "Failed to get onboarding progress",
        error: error.message,
      });
    }
  }

  /**
   * Start onboarding for a user
   * POST /api/v1/onboarding/start
   */
  async startOnboarding(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id;

      const { error } = await supabaseAdmin
        .from("user_onboarding")
        .upsert(
          {
            user_id: userId,
            current_step: 1,
            onboarding_completed: false,
            steps_completed: [],
            created_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          }
        );

      if (error) {
        throw error;
      }

      return res.status(200).json({
        success: true,
        message: "Onboarding started",
      });
    } catch (error: any) {
      logger.error("Error starting onboarding", {
        userId: req.user?.id,
        error: error.message,
      });
      return res.status(500).json({
        success: false,
        message: "Failed to start onboarding",
        error: error.message,
      });
    }
  }

  /**
   * Complete a step in the onboarding process
   * POST /api/v1/onboarding/complete-step
   */
  async completeStep(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id;
      const { step, data } = req.body;

      if (!step || typeof step !== "number") {
        return res.status(400).json({
          success: false,
          message: "Step number is required",
        });
      }

      const { data: currentProgress, error: fetchError } = await supabaseAdmin
        .from("user_onboarding")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (fetchError || !currentProgress) {
        return res.status(404).json({
          success: false,
          message: "Onboarding not started",
        });
      }

      let stepsCompleted = currentProgress.steps_completed || [];
      let checklistProgress = currentProgress.checklist_progress || {};
      let primaryGoal = currentProgress.primary_goal;
      let estimatedIncome = currentProgress.estimated_income;
      let preferredCategories = currentProgress.preferred_categories || [];

      if (!stepsCompleted.includes(step)) {
        stepsCompleted.push(step);
      }

      // Update specific data based on step
      if (data) {
        if (step === 1 && data.goal) {
          primaryGoal = data.goal;
        }
        if (step === 2) {
          if (data.estimatedIncome) estimatedIncome = data.estimatedIncome;
          if (data.preferredCategories)
            preferredCategories = data.preferredCategories;
        }
      }

      const nextStep = step < 5 ? step + 1 : step;

      const { error: updateError } = await supabaseAdmin
        .from("user_onboarding")
        .update({
          current_step: nextStep,
          steps_completed: stepsCompleted,
          checklist_progress: checklistProgress,
          primary_goal: primaryGoal,
          estimated_income: estimatedIncome,
          preferred_categories: preferredCategories,
          // Removed updated_at as it may not exist in the schema
        })
        .eq("user_id", userId);

      if (updateError) {
        throw updateError;
      }

      return res.status(200).json({
        success: true,
        message: "Step completed",
        data: {
          currentStep: nextStep,
          stepsCompleted,
        },
      });
    } catch (error: any) {
      logger.error("Error completing step", {
        userId: req.user?.id,
        error: error.message,
      });
      return res.status(500).json({
        success: false,
        message: "Failed to complete step",
        error: error.message,
      });
    }
  }

  /**
   * Complete entire onboarding
   * POST /api/v1/onboarding/complete
   */
  async completeOnboarding(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id;

      const { error } = await supabaseAdmin
        .from("user_onboarding")
        .update({
          onboarding_completed: true,
          current_step: 5,
          steps_completed: [1, 2, 3, 4, 5],
          completed_at: new Date().toISOString(),
          // Removed updated_at as it may not exist in the schema
        })
        .eq("user_id", userId);

      if (error) {
        throw error;
      }

      return res.status(200).json({
        success: true,
        message: "Onboarding completed",
      });
    } catch (error: any) {
      logger.error("Error completing onboarding", {
        userId: req.user?.id,
        error: error.message,
      });
      return res.status(500).json({
        success: false,
        message: "Failed to complete onboarding",
        error: error.message,
      });
    }
  }

  /**
   * Skip onboarding
   * POST /api/v1/onboarding/skip
   */
  async skipOnboarding(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id;

      const { error } = await supabaseAdmin
        .from("user_onboarding")
        .update({
          onboarding_completed: true,
          skipped: true,
          skipped_at: new Date().toISOString(),
          // Removed updated_at as it may not exist in the schema
        })
        .eq("user_id", userId);

      if (error) {
        throw error;
      }

      return res.status(200).json({
        success: true,
        message: "Onboarding skipped",
      });
    } catch (error: any) {
      logger.error("Error skipping onboarding", {
        userId: req.user?.id,
        error: error.message,
      });
      return res.status(500).json({
        success: false,
        message: "Failed to skip onboarding",
        error: error.message,
      });
    }
  }

  /**
   * Update checklist progress
   * POST /api/v1/onboarding/checklist
   */
  async updateChecklistProgress(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id;
      const { item, completed } = req.body;

      if (!item) {
        return res.status(400).json({
          success: false,
          message: "Checklist item is required",
        });
      }

      const { data: currentProgress, error: fetchError } = await supabaseAdmin
        .from("user_onboarding")
        .select("checklist_progress")
        .eq("user_id", userId)
        .single();

      if (fetchError || !currentProgress) {
        return res.status(404).json({
          success: false,
          message: "Onboarding not started",
        });
      }

      const checklistProgress = currentProgress.checklist_progress || {};
      checklistProgress[item] = completed !== false;

      const { error: updateError } = await supabaseAdmin
        .from("user_onboarding")
        .update({
          checklist_progress: checklistProgress,
          // Removed updated_at as it may not exist in the schema
        })
        .eq("user_id", userId);

      if (updateError) {
        throw updateError;
      }

      return res.status(200).json({
        success: true,
        message: "Checklist updated",
        data: { checklistProgress },
      });
    } catch (error: any) {
      logger.error("Error updating checklist", {
        userId: req.user?.id,
        error: error.message,
      });
      return res.status(500).json({
        success: false,
        message: "Failed to update checklist",
        error: error.message,
      });
    }
  }
}

