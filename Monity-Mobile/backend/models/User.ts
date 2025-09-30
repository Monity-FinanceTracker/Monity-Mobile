import { decryptObject, encryptObject } from "../middleware/encryption";
import { supabaseAdmin } from "../config";

export default class User {
  private static readonly TABLE_NAME = "profiles";
  static async getById(id: string) {
    const { data, error } = await supabaseAdmin
      .from(User.TABLE_NAME)
      .select("id, name, email, subscription_tier")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Error fetching user: ${error.message}`);
    }

    return decryptObject(User.TABLE_NAME, data);
  }

  static async update(id: string, updates: any) {
    const encryptedUpdates = encryptObject(User.TABLE_NAME, updates);

    const { data, error } = await supabaseAdmin
      .from(User.TABLE_NAME)
      .update(encryptedUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }

    return decryptObject(User.TABLE_NAME, data);
  }

  static async createDefaultCategories(userId: string) {
    const defaultCategories = [
      // Expense categories (typeId: 1)
      {
        name: "Alimentação",
        typeId: 1,
        userId: userId,
        color: "#F97316",
        icon: "Coffee",
        metadata: {
          description: "Food and dining expenses",
          is_system_category: true,
        },
      },
      {
        name: "Transporte",
        typeId: 1,
        userId: userId,
        color: "#3B82F6",
        icon: "Car",
        metadata: {
          description: "Transportation expenses",
          is_system_category: true,
        },
      },
      {
        name: "Moradia",
        typeId: 1,
        userId: userId,
        color: "#22C55E",
        icon: "Home",
        metadata: {
          description: "Housing expenses",
          is_system_category: true,
        },
      },
      {
        name: "Compras",
        typeId: 1,
        userId: userId,
        color: "#A855F7",
        icon: "ShoppingCart",
        metadata: {
          description: "Shopping expenses",
          is_system_category: true,
        },
      },
      {
        name: "Entretenimento",
        typeId: 1,
        userId: userId,
        color: "#EC4899",
        icon: "Gamepad2",
        metadata: {
          description: "Entertainment expenses",
          is_system_category: true,
        },
      },
      {
        name: "Saúde",
        typeId: 1,
        userId: userId,
        color: "#EF4444",
        icon: "Heart",
        metadata: {
          description: "Health expenses",
          is_system_category: true,
        },
      },
      // Income categories (typeId: 2)
      {
        name: "Salário",
        typeId: 2,
        userId: userId,
        color: "#22C55E",
        icon: "Briefcase",
        metadata: {
          description: "Salary income",
          is_system_category: true,
        },
      },
      {
        name: "Freelance",
        typeId: 2,
        userId: userId,
        color: "#3B82F6",
        icon: "TrendingUp",
        metadata: {
          description: "Freelance income",
          is_system_category: true,
        },
      },
      {
        name: "Investimento",
        typeId: 2,
        userId: userId,
        color: "#A855F7",
        icon: "TrendingUp",
        metadata: {
          description: "Investment income",
          is_system_category: true,
        },
      },
      // Savings categories (typeId: 3)
      {
        name: "Make Investments",
        typeId: 3,
        userId: userId,
        color: "#6366F1",
        icon: "TrendingUp",
        metadata: {
          savings_behavior: "investment",
          description: "Moving money from savings to investments",
          is_system_category: true,
        },
      },
      {
        name: "Withdraw Investments",
        typeId: 3,
        userId: userId,
        color: "#8B5CF6",
        icon: "TrendingDown",
        metadata: {
          savings_behavior: "divestment",
          description: "Moving money from investments back to savings",
          is_system_category: true,
        },
      },
    ];

    const { error } = await supabaseAdmin
      .from("categories")
      .insert(defaultCategories);

    if (error) {
      // Log the error but don't re-throw, as this is not a critical failure
      console.error(
        "Failed to create default categories for user:",
        userId,
        error.message
      );
    }
  }
}

// Export is already handled by export default class
