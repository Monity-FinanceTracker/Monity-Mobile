import { supabaseAdmin } from "../config/supabase";
import { encryptObject, decryptObject } from "../middleware/encryption";

export default class RecurringTransaction {
  private static readonly TABLE_NAME = "recurring_transactions";

  static async create(recurringTransactionData: {
    userId: string;
    description: string;
    amount: number;
    category: string;
    categoryId?: string | null;
    typeId: number;
    recurrenceDay: number;
    is_favorite?: boolean;
  }) {
    const {
      userId,
      description,
      amount,
      category,
      categoryId,
      typeId,
      recurrenceDay,
      is_favorite = false,
    } = recurringTransactionData;

    // Encrypt sensitive fields
    const encryptedData = encryptObject(RecurringTransaction.TABLE_NAME, {
      description,
      category,
    });

    const finalInsertValue = {
      userId,
      ...encryptedData,
      amount,
      categoryId: categoryId || null,
      typeId,
      recurrenceDay,
      is_favorite: is_favorite === true,
    };

    const { data, error } = await supabaseAdmin
      .from(RecurringTransaction.TABLE_NAME)
      .insert([finalInsertValue])
      .select("*, is_favorite, categoryId")
      .single();

    if (error) {
      console.error("❌ RecurringTransaction.create - Supabase error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      throw new Error(`Error creating recurring transaction: ${error.message}`);
    }

    // Decrypt sensitive fields
    const decryptedData = decryptObject(RecurringTransaction.TABLE_NAME, data);

    return {
      ...decryptedData,
      is_favorite: data.is_favorite,
      categoryId: data.categoryId,
    };
  }

  static async getAll(userId: string) {
    const { data, error } = await supabaseAdmin
      .from(RecurringTransaction.TABLE_NAME)
      .select("*, is_favorite, categoryId")
      .eq("userId", userId)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("❌ RecurringTransaction.getAll - Supabase error:", error);
      throw new Error(`Error fetching recurring transactions: ${error.message}`);
    }

    // Decrypt sensitive fields for each transaction
    return data.map((item) => {
      const decrypted = decryptObject(RecurringTransaction.TABLE_NAME, item);
      return {
        ...decrypted,
        is_favorite: item.is_favorite,
        categoryId: item.categoryId,
      };
    });
  }

  static async getById(id: string, userId: string) {
    const { data, error } = await supabaseAdmin
      .from(RecurringTransaction.TABLE_NAME)
      .select("*, is_favorite, categoryId")
      .eq("id", id)
      .eq("userId", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      console.error("❌ RecurringTransaction.getById - Supabase error:", error);
      throw new Error(`Error fetching recurring transaction: ${error.message}`);
    }

    // Decrypt sensitive fields
    const decrypted = decryptObject(RecurringTransaction.TABLE_NAME, data);

    return {
      ...decrypted,
      is_favorite: data.is_favorite,
      categoryId: data.categoryId,
    };
  }

  static async update(
    id: string,
    userId: string,
    updateData: {
      description?: string;
      amount?: number;
      category?: string;
      categoryId?: string | null;
      typeId?: number;
      recurrenceDay?: number;
      is_favorite?: boolean;
    }
  ) {
    // Build update object
    const updateObj: any = {};

    // Encrypt sensitive fields if they're being updated
    if (updateData.description !== undefined || updateData.category !== undefined) {
      const fieldsToEncrypt: any = {};
      if (updateData.description !== undefined) {
        fieldsToEncrypt.description = updateData.description;
      }
      if (updateData.category !== undefined) {
        fieldsToEncrypt.category = updateData.category;
      }
      const encrypted = encryptObject(RecurringTransaction.TABLE_NAME, fieldsToEncrypt);
      Object.assign(updateObj, encrypted);
    }

    // Add non-encrypted fields
    if (updateData.amount !== undefined) updateObj.amount = updateData.amount;
    if (updateData.categoryId !== undefined) updateObj.categoryId = updateData.categoryId;
    if (updateData.typeId !== undefined) updateObj.typeId = updateData.typeId;
    if (updateData.recurrenceDay !== undefined) updateObj.recurrenceDay = updateData.recurrenceDay;
    if (updateData.is_favorite !== undefined) {
      updateObj.is_favorite = updateData.is_favorite === true;
    }

    updateObj.updatedAt = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from(RecurringTransaction.TABLE_NAME)
      .update(updateObj)
      .eq("id", id)
      .eq("userId", userId)
      .select("*, is_favorite, categoryId")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      console.error("❌ RecurringTransaction.update - Supabase error:", error);
      throw new Error(`Error updating recurring transaction: ${error.message}`);
    }

    // Decrypt sensitive fields
    const decrypted = decryptObject(RecurringTransaction.TABLE_NAME, data);

    return {
      ...decrypted,
      is_favorite: data.is_favorite,
      categoryId: data.categoryId,
    };
  }

  static async delete(id: string, userId: string) {
    const { data, error } = await supabaseAdmin
      .from(RecurringTransaction.TABLE_NAME)
      .delete()
      .eq("id", id)
      .eq("userId", userId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      console.error("❌ RecurringTransaction.delete - Supabase error:", error);
      throw new Error(`Error deleting recurring transaction: ${error.message}`);
    }

    return data;
  }
}


