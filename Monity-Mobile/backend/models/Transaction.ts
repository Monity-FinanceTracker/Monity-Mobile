import { decryptObject, encryptObject } from "../middleware/encryption";
import { supabaseAdmin } from "../config";

export default class Transaction {
  private static readonly TABLE_NAME = "transactions";
  static async create(transactionData: any) {
    const encryptedData = encryptObject(Transaction.TABLE_NAME, {
      ...transactionData,
      createdAt: new Date().toISOString(),
    });

    const { data, error } = await supabaseAdmin
      .from(Transaction.TABLE_NAME)
      .insert([encryptedData])
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating transaction: ${error.message}`);
    }

    return decryptObject(Transaction.TABLE_NAME, data);
  }

  static async getById(id: string, userId: string) {
    const { data, error } = await supabaseAdmin
      .from(Transaction.TABLE_NAME)
      .select("*")
      .eq("id", id)
      .eq("userId", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Error fetching transaction: ${error.message}`);
    }

    return decryptObject(Transaction.TABLE_NAME, data);
  }

  static async getAll(userId: string) {
    const { data, error } = await supabaseAdmin
      .from(Transaction.TABLE_NAME)
      .select("*")
      .eq("userId", userId)
      .order("date", { ascending: false });

    if (error) {
      throw new Error(`Error fetching transactions for user: ${error.message}`);
    }

    return decryptObject(Transaction.TABLE_NAME, data);
  }

  static async getRecent(userId: string, limit: number = 5) {
    const { data, error } = await supabaseAdmin
      .from(Transaction.TABLE_NAME)
      .select("*")
      .eq("userId", userId)
      .order("date", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(
        `Error fetching recent transactions for user: ${error.message}`
      );
    }

    return decryptObject(Transaction.TABLE_NAME, data);
  }

  static async update(id: string, userId: string, updates: any) {
    const encryptedUpdates = encryptObject(Transaction.TABLE_NAME, updates);

    const { data, error } = await supabaseAdmin
      .from(Transaction.TABLE_NAME)
      .update(encryptedUpdates)
      .eq("id", id)
      .eq("userId", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating transaction: ${error.message}`);
    }

    return decryptObject(Transaction.TABLE_NAME, data);
  }

  static async delete(id: string, userId: string) {
    const { data, error } = await supabaseAdmin
      .from(Transaction.TABLE_NAME)
      .delete()
      .eq("id", id)
      .eq("userId", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error deleting transaction: ${error.message}`);
    }

    return decryptObject(Transaction.TABLE_NAME, data);
  }
}

// Export is already handled by export default class
