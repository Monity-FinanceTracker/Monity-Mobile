import { supabaseAdmin } from "../config";
import { decryptObject, encryptObject } from "../middleware/encryption";

export default class Category {
  private static readonly TABLE_NAME = "categories";

  static async create(categoryData: any) {
    // Ensure metadata is included and properly formatted
    const categoryWithMetadata = {
      ...categoryData,
      metadata: categoryData.metadata || {},
    };

    const encryptedData = encryptObject(
      Category.TABLE_NAME,
      categoryWithMetadata
    );

    const { data, error } = await supabaseAdmin
      .from(Category.TABLE_NAME)
      .insert([encryptedData])
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating category: ${error.message}`);
    }

    return decryptObject(Category.TABLE_NAME, data);
  }

  static async findById(id: string, userId: string) {
    const { data, error } = await supabaseAdmin
      .from(Category.TABLE_NAME)
      .select("*")
      .eq("id", id)
      .eq("userId", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Error fetching category: ${error.message}`);
    }

    return decryptObject(Category.TABLE_NAME, data);
  }

  static async findByUser(userId: string) {
    const { data, error } = await supabaseAdmin
      .from(Category.TABLE_NAME)
      .select("*")
      .eq("userId", userId)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(`Error fetching categories for user: ${error.message}`);
    }

    return decryptObject(Category.TABLE_NAME, data);
  }

  static async update(id: string, userId: string, updates: any) {
    const encryptedUpdates = encryptObject(Category.TABLE_NAME, updates);

    const { data, error } = await supabaseAdmin
      .from(Category.TABLE_NAME)
      .update(encryptedUpdates)
      .eq("id", id)
      .eq("userId", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating category: ${error.message}`);
    }

    return decryptObject(Category.TABLE_NAME, data);
  }

  static async delete(id: string, userId: string) {
    const { error } = await supabaseAdmin
      .from(Category.TABLE_NAME)
      .delete()
      .eq("id", id)
      .eq("userId", userId);

    if (error) {
      throw new Error(`Error deleting category: ${error.message}`);
    }

    return { success: true };
  }
}

// Export is already handled by export default class
