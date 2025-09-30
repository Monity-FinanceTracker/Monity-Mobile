import { supabaseAdmin } from "../config";
import { decryptObject, encryptObject } from "../middleware/encryption";

export default class Budget {
  private static readonly TABLE_NAME = "budgets";
  static async create(budgetData: any) {
    const encryptedData = encryptObject(Budget.TABLE_NAME, budgetData);
    const { data, error } = await supabaseAdmin
      .from(Budget.TABLE_NAME)
      .insert([encryptedData])
      .select()
      .single();
    if (error) throw new Error(`Error creating budget: ${error.message}`);
    return decryptObject(Budget.TABLE_NAME, data);
  }

  static async findByUserId(userId: string) {
    const { data, error } = await supabaseAdmin
      .from(Budget.TABLE_NAME)
      .select("*")
      .eq("userId", userId);
    if (error) throw new Error(`Error fetching budgets: ${error.message}`);
    return decryptObject(Budget.TABLE_NAME, data);
  }

  static async findById(id: string, userId: string) {
    const { data, error } = await supabaseAdmin
      .from(Budget.TABLE_NAME)
      .select("*")
      .eq("id", id)
      .eq("userId", userId)
      .single();
    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Error fetching budget: ${error.message}`);
    }
    return decryptObject(Budget.TABLE_NAME, data);
  }

  static async update(id: string, userId: string, updates: any) {
    const encryptedUpdates = encryptObject(Budget.TABLE_NAME, updates);
    const { data, error } = await supabaseAdmin
      .from(Budget.TABLE_NAME)
      .update(encryptedUpdates)
      .eq("id", id)
      .eq("userId", userId)
      .select()
      .single();
    if (error) throw new Error(`Error updating budget: ${error.message}`);
    return decryptObject(Budget.TABLE_NAME, data);
  }

  static async delete(id: string, userId: string) {
    const { error } = await supabaseAdmin
      .from(Budget.TABLE_NAME)
      .delete()
      .eq("id", id)
      .eq("userId", userId);
    if (error) throw new Error(`Error deleting budget: ${error.message}`);
    return { success: true };
  }
}

// Export is already handled by export default class
