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
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const { data, error } = await supabaseAdmin
      .from(TABLE_NAME)
      .select("*")
      .eq("user_id", userId)
      .eq("year", year)
      .eq("month", month)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No record found, return default
        return {
          user_id: userId,
          year,
          month,
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
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // Try to get existing record
    const existing = await this.getMonthlyUsage(userId);

    if (existing.simulation_count === undefined) {
      // Create new record
      const { data, error } = await supabaseAdmin
        .from(TABLE_NAME)
        .insert([
          {
            user_id: userId,
            year,
            month,
            simulation_count: 1,
            updated_at: new Date().toISOString(),
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
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("year", year)
        .eq("month", month)
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
    const { data, error } = await supabaseAdmin
      .from(SIMULATIONS_TABLE)
      .insert([
        {
          user_id: userId,
          ...simulationData,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Error saving simulation: ${error.message}`);
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
      .eq("user_id", userId)
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
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error deleting simulation: ${error.message}`);
    }

    return data;
  }
}

