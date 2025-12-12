import { supabaseAdmin } from "../config";
import { logger } from "../utils/logger";

const TABLE_NAME = "investment_calculator_usage";
const SIMULATIONS_TABLE = "investment_calculator_simulations";
const FREE_TIER_MONTHLY_LIMIT = 3;

export default class InvestmentCalculator {
  /**
   * Get current month usage for a user
   */
  static async getMonthlyUsage(userId: string) {
    const now = new Date();
    // Create date for first day of current month (YYYY-MM-01)
    const monthDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthDateStr = monthDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    const { data, error } = await supabaseAdmin
      .from(TABLE_NAME)
      .select("*")
      .eq("userId", userId)
      .eq("month", monthDateStr)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No record found, return default
        return {
          userId: userId,
          month: monthDateStr,
          simulation_count: 0,
        };
      }
      throw new Error(`Error fetching usage: ${error.message}`);
    }

    return data;
  }

  /**
   * Increment usage count for a user
   */
  static async incrementUsage(userId: string) {
    const now = new Date();
    // Create date for first day of current month (YYYY-MM-01)
    const monthDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthDateStr = monthDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    // Try to get existing record
    const existing = await this.getMonthlyUsage(userId);

    if (existing.simulation_count === undefined) {
      // Create new record
      const { data, error } = await supabaseAdmin
        .from(TABLE_NAME)
        .insert([
          {
            userId: userId,
            month: monthDateStr,
            simulation_count: 1,
            updatedAt: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        throw new Error(`Error creating usage record: ${error.message}`);
      }

      return data;
    } else {
      // Update existing record
      const { data, error } = await supabaseAdmin
        .from(TABLE_NAME)
        .update({
          simulation_count: existing.simulation_count + 1,
          updatedAt: new Date().toISOString(),
        })
        .eq("userId", userId)
        .eq("month", monthDateStr)
        .select()
        .single();

      if (error) {
        throw new Error(`Error updating usage: ${error.message}`);
      }

      return data;
    }
  }

  /**
   * Save simulation for premium users
   */
  static async saveSimulation(userId: string, simulationData: any) {
    const {
      initialInvestment,
      contributionAmount,
      contributionFrequency,
      annualInterestRate,
      goalDate,
      finalValue,
      totalContributions,
      totalInterest,
      roiPercentage,
      metadata = {}
    } = simulationData;

    const insertData = {
      userId: userId,
      initial_investment: initialInvestment,
      contribution_amount: contributionAmount,
      contribution_frequency: contributionFrequency,
      annual_interest_rate: annualInterestRate,
      goal_date: goalDate,
      final_value: finalValue,
      total_contributions: totalContributions,
      total_interest: totalInterest,
      roi_percentage: roiPercentage,
      metadata,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from(SIMULATIONS_TABLE)
      .insert([insertData])
      .select()
      .single();

    if (error) {
      // Log detailed error information for debugging
      const logger = require("../utils/logger").logger;
      logger.error("Error saving investment simulation", {
        userId,
        error: error.message,
        errorCode: error.code,
        errorDetails: error.details,
        insertData: {
          ...insertData,
          metadata: typeof insertData.metadata === 'object' ? JSON.stringify(insertData.metadata) : insertData.metadata,
        },
      });
      
      throw new Error(`Error saving simulation: ${error?.message || 'Unknown error'}`);
    }

    return data;
  }

  /**
   * Get saved simulations for a user
   */
  static async getSimulations(userId: string) {
    const { data, error } = await supabaseAdmin
      .from(SIMULATIONS_TABLE)
      .select("*")
      .eq("userId", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Error fetching simulations: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Delete a simulation
   */
  static async deleteSimulation(simulationId: string, userId: string) {
    const { data, error } = await supabaseAdmin
      .from(SIMULATIONS_TABLE)
      .delete()
      .eq("id", simulationId)
      .eq("userId", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error deleting simulation: ${error.message}`);
    }

    return data;
  }
}



