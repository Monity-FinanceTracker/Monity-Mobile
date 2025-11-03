import { logger } from "../utils/logger";
import SavingsGoal from "../models/SavingsGoal";

interface SavingsGoalData {
  target_amount: number;
  current_amount: number;
  target_date: string;
}

interface ProjectionResult {
  projectedDate: Date | null;
  monthsToReachGoal: number;
  daysSooner: number;
  goalMet: boolean;
}

export default class FinancialProjectionsService {
  private supabase: any;
  private savingsGoalModel: SavingsGoal;

  constructor(supabase: any) {
    this.supabase = supabase;
    this.savingsGoalModel = new SavingsGoal(supabase);
  }

  /**
   * Projects future financial scenarios based on savings goals.
   * @param goalId - The ID of the savings goal.
   * @param extraMonthlySavings - Additional monthly savings amount.
   * @param userId - The ID of the user.
   * @returns The projection results.
   */
  async projectSavingsGoal(
    goalId: string,
    extraMonthlySavings: number,
    userId: string
  ): Promise<ProjectionResult> {
    try {
      const goal = await this.savingsGoalModel.findById(goalId, userId);
      if (!goal) {
        throw new Error("Savings goal not found");
      }

      const remainingAmount = goal.target_amount - goal.current_amount;
      if (remainingAmount <= 0) {
        return {
          projectedDate: new Date(),
          monthsToReachGoal: 0,
          daysSooner: 0,
          goalMet: true,
        };
      }

      if (extraMonthlySavings <= 0) {
        return {
          projectedDate: null,
          monthsToReachGoal: Infinity,
          daysSooner: 0,
          goalMet: false,
        };
      }

      const monthsToReachGoal = remainingAmount / extraMonthlySavings;

      const originalTargetDate = new Date(goal.target_date);
      const projectedDate = new Date();
      projectedDate.setMonth(projectedDate.getMonth() + monthsToReachGoal);

      const timeDifference =
        originalTargetDate.getTime() - projectedDate.getTime();
      const daysSooner = Math.max(
        0,
        Math.ceil(timeDifference / (1000 * 3600 * 24))
      );

      const result: ProjectionResult = {
        projectedDate,
        monthsToReachGoal: Math.ceil(monthsToReachGoal),
        daysSooner,
        goalMet: false,
      };

      logger.info(
        `Financial projection calculated for goal ${goalId} for user ${userId}`
      );

      return result;
    } catch (error: any) {
      logger.error(
        `Failed to calculate financial projection for goal ${goalId}`,
        {
          error: error.message,
          userId,
        }
      );
      throw error;
    }
  }
}
