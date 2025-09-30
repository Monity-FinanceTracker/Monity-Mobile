import SavingsGoal from "../models/SavingsGoal";
import { logger } from "../utils/logger";

interface GoalData {
  user_id: string;
  goal_name: string;
  target_amount: number;
  target_date: string;
  current_amount?: number;
  [key: string]: any;
}

interface GoalUpdates {
  goal_name?: string;
  target_amount?: number;
  target_date?: string;
  current_amount?: number;
  [key: string]: any;
}

export default class SavingsGoalsService {
  private savingsGoalModel: SavingsGoal;

  constructor() {
    this.savingsGoalModel = new SavingsGoal(null);
  }

  async createGoal(goalData: GoalData): Promise<any> {
    try {
      return await this.savingsGoalModel.create(goalData);
    } catch (error: any) {
      logger.error("Error in createGoal service", {
        error: error.message,
        goalData,
      });
      throw new Error("Failed to create savings goal.");
    }
  }

  async getGoalsForUser(userId: string): Promise<any> {
    try {
      return await this.savingsGoalModel.findByUser(userId);
    } catch (error: any) {
      logger.error("Error in getGoalsForUser service", {
        error: error.message,
        userId,
      });
      throw new Error("Failed to retrieve savings goals.");
    }
  }

  async updateGoal(
    id: string,
    userId: string,
    updates: GoalUpdates
  ): Promise<any> {
    try {
      return await this.savingsGoalModel.update(id, userId, updates);
    } catch (error: any) {
      logger.error("Error in updateGoal service", {
        error: error.message,
        id,
        updates,
      });
      throw new Error("Failed to update savings goal.");
    }
  }

  async deleteGoal(id: string, userId: string): Promise<any> {
    try {
      return await this.savingsGoalModel.delete(id, userId);
    } catch (error: any) {
      logger.error("Error in deleteGoal service", { error: error.message, id });
      throw new Error("Failed to delete savings goal.");
    }
  }

  async allocateToGoal(
    id: string,
    userId: string,
    amount: number
  ): Promise<any> {
    try {
      // This is a business logic operation that calls a specific RPC
      return await this.savingsGoalModel.allocate(id, userId, amount);
    } catch (error: any) {
      logger.error("Error in allocateToGoal service", {
        error: error.message,
        id,
        amount,
      });
      throw new Error("Failed to allocate to savings goal.");
    }
  }
}

// Export singleton instance
export const savingsGoalsService = new SavingsGoalsService();
