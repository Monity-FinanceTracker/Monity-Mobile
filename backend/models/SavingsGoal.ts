import { supabaseAdmin } from "../config/supabase";
import { decryptObject, encryptObject } from "../middleware/encryption";

export default class SavingsGoal {
  private supabase: any;
  private static readonly TABLE_NAME = "savings_goals";
  constructor(supabase: any) {
    this.supabase = supabase; // Keep for backward compatibility, but use admin client
  }

  async create(goalData: any) {
    const encryptedData = encryptObject(SavingsGoal.TABLE_NAME, goalData);

    const { data, error } = await supabaseAdmin
      .from(SavingsGoal.TABLE_NAME)
      .insert([encryptedData])
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating savings goal: ${error.message}`);
    }

    return decryptObject(SavingsGoal.TABLE_NAME, data);
  }

  async findById(id: string, userId: string) {
    const { data, error } = await supabaseAdmin
      .from(SavingsGoal.TABLE_NAME)
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Error fetching savings goal: ${error.message}`);
    }

    return decryptObject(SavingsGoal.TABLE_NAME, data);
  }

  async findByUser(userId: string) {
    const { data, error } = await supabaseAdmin
      .from(SavingsGoal.TABLE_NAME)
      .select("*")
      .eq("user_id", userId)
      .order("target_date", { ascending: true });

    if (error) {
      throw new Error(
        `Error fetching savings goals for user: ${error.message}`
      );
    }

    return decryptObject(SavingsGoal.TABLE_NAME, data);
  }

  async update(id: string, userId: string, updates: any) {
    const encryptedUpdates = encryptObject(SavingsGoal.TABLE_NAME, updates);

    const { data, error } = await supabaseAdmin
      .from(SavingsGoal.TABLE_NAME)
      .update(encryptedUpdates)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating savings goal: ${error.message}`);
    }

    return decryptObject(SavingsGoal.TABLE_NAME, data);
  }

  async delete(id: string, userId: string) {
    const { error } = await supabaseAdmin
      .from(SavingsGoal.TABLE_NAME)
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Error deleting savings goal: ${error.message}`);
    }

    return { success: true };
  }

  async allocate(id: string, userId: string, amount: number) {
    const { data, error } = await supabaseAdmin.rpc("allocate_to_goal", {
      goal_id: id,
      user_id_input: userId,
      amount_to_allocate: amount,
    });

    if (error) {
      throw new Error(`Error allocating to savings goal: ${error.message}`);
    }

    return data;
  }
}

// Export is already handled by export default class
