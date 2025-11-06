import { decryptObject, encryptObject } from "../middleware/encryption";
import { supabaseAdmin } from "../config";

export default class Transaction {
  private static readonly TABLE_NAME = "transactions";
  static async create(transactionData: any) {
    // Preserve is_favorite explicitly before encryption (it's not a sensitive field)
    // Handle both camelCase and snake_case
    const rawIsFavorite = transactionData.is_favorite !== undefined 
      ? transactionData.is_favorite 
      : (transactionData.isFavorite !== undefined ? transactionData.isFavorite : false);
    
    // Convert to proper boolean - handle all possible truthy values
    let finalIsFavorite: boolean;
    if (rawIsFavorite === false || rawIsFavorite === "false" || rawIsFavorite === 0 || rawIsFavorite === "0") {
      finalIsFavorite = false;
    } else if (rawIsFavorite === true || rawIsFavorite === "true" || rawIsFavorite === 1 || rawIsFavorite === "1") {
      finalIsFavorite = true;
    } else {
      // For undefined or null, default to false
      finalIsFavorite = false;
    }
    
    console.log("🔍 Transaction.create - Input data:", {
      "transactionData.is_favorite": transactionData.is_favorite,
      "transactionData.isFavorite": transactionData.isFavorite,
      "rawIsFavorite": rawIsFavorite,
      "finalIsFavorite": finalIsFavorite,
      "typeof finalIsFavorite": typeof finalIsFavorite,
      "fullDataKeys": Object.keys(transactionData),
    });
    
    // Create the data object with all fields
    const dataToEncrypt = {
      ...transactionData,
      createdAt: new Date().toISOString(),
    };
    
    const encryptedData = encryptObject(Transaction.TABLE_NAME, dataToEncrypt);
    
    console.log("🔍 Transaction.create - After encryption:", {
      "hasIsFavorite": "is_favorite" in encryptedData,
      "is_favorite": encryptedData.is_favorite,
      "encryptedKeys": Object.keys(encryptedData),
    });
    
    // CRITICAL: Set is_favorite AFTER encryption to ensure it's never removed
    // The encryption only handles 'description', so is_favorite should pass through
    // But we'll set it explicitly after encryption to be 100% sure
    encryptedData.is_favorite = finalIsFavorite === true ? true : false;
    
    // Create insert object - explicitly include is_favorite at the end
    const insertData: any = {
      ...encryptedData,
      // Force include is_favorite as the LAST property to ensure it's not overwritten
      is_favorite: finalIsFavorite === true ? true : false,
    };
    
    console.log("🔍 Transaction.create - Before Supabase insert:", {
      "hasIsFavorite": "is_favorite" in insertData,
      "is_favorite": insertData.is_favorite,
      "typeof": typeof insertData.is_favorite,
      "isTrue": insertData.is_favorite === true,
      "isFalse": insertData.is_favorite === false,
      "insertDataKeys": Object.keys(insertData),
      "is_favorite_value": insertData.is_favorite,
      "sample_keys": Object.keys(insertData).slice(0, 5),
      "total_keys": Object.keys(insertData).length,
    });
    
    // Triple check - log the exact value being sent
    console.log("🔍🔍🔍 FINAL CHECK - is_favorite value:", {
      "value": insertData.is_favorite,
      "type": typeof insertData.is_favorite,
      "stringified": JSON.stringify(insertData.is_favorite),
      "in_object": "is_favorite" in insertData,
    });

    // Final verification before insert
    // CRITICAL: Always explicitly set is_favorite as a boolean to avoid NULL
    const finalInsertValue = {
      ...insertData,
      is_favorite: finalIsFavorite === true ? true : false, // Always set as explicit boolean
    };
    
    // Remove any undefined/null values that might interfere
    Object.keys(finalInsertValue).forEach(key => {
      if (finalInsertValue[key] === undefined || finalInsertValue[key] === null) {
        if (key === 'is_favorite') {
          finalInsertValue[key] = false; // Never allow NULL for is_favorite
        }
      }
    });
    
    console.log("🚀 FINAL INSERT - Sending to Supabase:", {
      "is_favorite": finalInsertValue.is_favorite,
      "typeof": typeof finalInsertValue.is_favorite,
      "has_field": "is_favorite" in finalInsertValue,
      "all_keys_count": Object.keys(finalInsertValue).length,
      "is_favorite_explicit": finalInsertValue.is_favorite === true || finalInsertValue.is_favorite === false,
    });

    const { data, error } = await supabaseAdmin
      .from(Transaction.TABLE_NAME)
      .insert([finalInsertValue])
      .select("*, is_favorite") // Explicitly select is_favorite to ensure it's returned
      .single();

    if (error) {
      console.error("❌ Transaction.create - Supabase error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        "sent_data": JSON.stringify(finalInsertValue, null, 2),
      });
      throw new Error(`Error creating transaction: ${error.message}`);
    }
    
    console.log("✅ Transaction.create - Supabase response:", {
      id: data?.id,
      "is_favorite": data?.is_favorite,
      "typeof": typeof data?.is_favorite,
      "is_null": data?.is_favorite === null,
      "is_undefined": data?.is_favorite === undefined,
      "fullData_is_favorite": data ? (data as any).is_favorite : "no data",
    });

    // Decrypt sensitive fields but preserve is_favorite
    const decryptedData = decryptObject(Transaction.TABLE_NAME, data);
    
    // Ensure is_favorite is preserved from the database response
    if (data && data.is_favorite !== undefined) {
      decryptedData.is_favorite = data.is_favorite === true;
    }
    
    return decryptedData;
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

    // Decrypt sensitive fields but preserve is_favorite
    const decryptedData = decryptObject(Transaction.TABLE_NAME, data);
    
    // Ensure is_favorite is preserved
    if (data && data.is_favorite !== undefined) {
      decryptedData.is_favorite = data.is_favorite === true;
    }
    
    return decryptedData;
  }

  static async getAll(
    userId: string,
    filters?: {
      type?: "income" | "expense";
      categoryId?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
    }
  ) {
    console.log("🔍 Transaction.getAll - Filters received:", JSON.stringify(filters));
    console.log("🔍 Transaction.getAll - startDate:", filters?.startDate);
    console.log("🔍 Transaction.getAll - endDate:", filters?.endDate);
    
    let query = supabaseAdmin
      .from(Transaction.TABLE_NAME)
      .select("*")
      .eq("userId", userId);

    // Apply type filter (typeId: 1 = expense, 2 = income)
    if (filters?.type) {
      const typeId = filters.type === "income" ? 2 : 1;
      console.log(`🔍 Applying type filter: ${filters.type} (typeId: ${typeId})`);
      query = query.eq("typeId", typeId);
    }

    // Note: Category filter will be applied after decryption
    // because we need to get the category name first and filter in memory
    // to ensure it works correctly with encrypted descriptions
    let categoryFilterName: string | null = null;
    if (filters?.categoryId) {
      console.log(`🔍 Getting category name for filter: ${filters.categoryId}`);
      // First, get the category name from the categoryId
      const { data: categoryData, error: categoryError } = await supabaseAdmin
        .from("categories")
        .select("name")
        .eq("id", filters.categoryId)
        .single();

      if (categoryError) {
        console.error("🔍 Error fetching category:", categoryError);
        console.error("🔍 Category error details:", {
          message: categoryError.message,
          code: categoryError.code,
          details: categoryError.details,
        });
      }

      if (categoryData?.name) {
        // categoryData.name is the encrypted value from the database
        // We need to use it for filtering at DB level
        const encryptedCategoryName = categoryData.name;
        console.log(`🔍 Category name (encrypted in DB): ${encryptedCategoryName.substring(0, 50)}...`);
        
        // Apply filter at database level using the encrypted category name
        query = query.eq("category", encryptedCategoryName);
        console.log(`🔍 Category filter applied at DB level using encrypted name`);
        
        // Also get the decrypted name for post-decryption filtering (as fallback)
        // Use Category model to get decrypted name
        const Category = require("./Category").default;
        const decryptedCategory = await Category.findById(filters.categoryId, userId);
        if (decryptedCategory?.name) {
          categoryFilterName = decryptedCategory.name;
          console.log(`🔍 Category name (decrypted for fallback): ${categoryFilterName}`);
        }
      } else {
        console.log("🔍 Category not found for ID:", filters.categoryId);
        console.log("🔍 Category data received:", categoryData);
      }
    }

    // Apply date range filters
    if (filters?.startDate) {
      console.log(`🔍 Applying startDate filter: ${filters.startDate}`);
      // Ensure date is in YYYY-MM-DD format
      const startDateStr = filters.startDate.includes("T") 
        ? filters.startDate.split("T")[0] 
        : filters.startDate;
      console.log(`🔍 StartDate filter string: ${startDateStr}`);
      // Use gte to include the start date
      query = query.gte("date", startDateStr);
    }
    if (filters?.endDate) {
      // Ensure date is in YYYY-MM-DD format
      const endDateInput = filters.endDate.includes("T") 
        ? filters.endDate.split("T")[0] 
        : filters.endDate;
      console.log(`🔍 Applying endDate filter: ${filters.endDate} -> ${endDateInput}`);
      // Use lte to include the entire end date
      query = query.lte("date", endDateInput);
    }

    // Apply search filter (search in description)
    if (filters?.search) {
      console.log(`🔍 Applying search filter: ${filters.search}`);
      query = query.ilike("description", `%${filters.search}%`);
    }

    query = query.order("date", { ascending: false });

    console.log("🔍 Final query being executed with filters");
    console.log("🔍 Applied filters summary:", {
      hasTypeFilter: !!filters?.type,
      hasCategoryFilter: !!filters?.categoryId,
      hasStartDateFilter: !!filters?.startDate,
      hasEndDateFilter: !!filters?.endDate,
      hasSearchFilter: !!filters?.search,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
    });
    
    const { data, error } = await query;

    if (error) {
      console.error("🔍 Query error:", error);
      throw new Error(`Error fetching transactions for user: ${error.message}`);
    }

    console.log(`🔍 Query returned ${data?.length || 0} transactions`);
    if (data && data.length > 0) {
      console.log("🔍 Sample transaction dates:", data.slice(0, 5).map((t: any) => ({
        id: t.id,
        date: t.date,
        description: t.description?.substring(0, 30),
      })));
      
      // Check if date filters are working
      if (filters?.startDate || filters?.endDate) {
        const startDateStr = filters?.startDate?.includes("T") 
          ? filters.startDate.split("T")[0] 
          : filters?.startDate;
        const endDateStr = filters?.endDate?.includes("T") 
          ? filters.endDate.split("T")[0] 
          : filters?.endDate;
        
        const filteredDates = data
          .map((t: any) => t.date)
          .filter((date: string) => {
            const dateStr = date?.includes("T") ? date.split("T")[0] : date;
            const isAfterStart = !startDateStr || dateStr >= startDateStr;
            const isBeforeEnd = !endDateStr || dateStr <= endDateStr;
            return isAfterStart && isBeforeEnd;
          });
        
        console.log("🔍 Date filter validation:", {
          expectedCount: filteredDates.length,
          actualCount: data.length,
          startDate: startDateStr,
          endDate: endDateStr,
          allDates: data.map((t: any) => t.date?.includes("T") ? t.date.split("T")[0] : t.date),
        });
      }
    }

    // Preserve original data before decryption to access is_favorite
    const originalData = Array.isArray(data) ? [...data] : data;
    
    // Debug: Log original data to check is_favorite values
    if (Array.isArray(originalData) && originalData.length > 0) {
      console.log("🔍 Transaction.getAll - Sample original data:", 
        originalData.slice(0, 3).map((item: any) => ({ 
          id: item.id, 
          is_favorite: item.is_favorite, 
          typeof: typeof item.is_favorite 
        }))
      );
    }
    
    // Decrypt sensitive fields but preserve is_favorite
    const decryptedData = decryptObject(Transaction.TABLE_NAME, data);
    
    // Apply category filter after decryption if needed (as a fallback)
    let filteredData = decryptedData;
    if (categoryFilterName && Array.isArray(decryptedData)) {
      const beforeFilter = decryptedData.length;
      filteredData = decryptedData.filter((item: any) => {
        const itemCategory = item.category || item.category_name || "";
        const matches = itemCategory === categoryFilterName;
        if (!matches && beforeFilter <= 20) {
          // Log for debugging if we have few items
          console.log(`🔍 Category filter: item category "${itemCategory}" !== filter "${categoryFilterName}"`);
        }
        return matches;
      });
      console.log(`🔍 Category filter applied: ${beforeFilter} -> ${filteredData.length} transactions`);
    }
    
    // Ensure is_favorite is preserved for all transactions
    if (Array.isArray(filteredData) && Array.isArray(originalData)) {
      return filteredData.map((item: any, index: number) => {
        // Find corresponding original item by ID since filtering may have changed order
        const originalItem = Array.isArray(originalData) 
          ? originalData.find((orig: any) => orig.id === item.id) 
          : originalData;
        if (originalItem) {
          // Explicitly set is_favorite, handling null, true, false, and undefined
          if (originalItem.is_favorite !== undefined && originalItem.is_favorite !== null) {
            item.is_favorite = originalItem.is_favorite === true || originalItem.is_favorite === "true" || originalItem.is_favorite === 1;
          } else {
            item.is_favorite = false;
          }
        }
        return item;
      });
    }
    
    return filteredData;
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

    // Preserve original data before decryption to access is_favorite
    const originalData = Array.isArray(data) ? [...data] : data;
    
    // Decrypt sensitive fields but preserve is_favorite
    const decryptedData = decryptObject(Transaction.TABLE_NAME, data);
    
    // Ensure is_favorite is preserved for all transactions
    if (Array.isArray(decryptedData) && Array.isArray(originalData)) {
      return decryptedData.map((item: any, index: number) => {
        // Preserve is_favorite if it exists in the original data
        const originalItem = originalData[index];
        if (originalItem && originalItem.is_favorite !== undefined) {
          item.is_favorite = originalItem.is_favorite === true;
        }
        return item;
      });
    }
    
    return decryptedData;
  }

  static async update(id: string, userId: string, updates: any) {
    console.log("🔍 Transaction.update - Input:", {
      id,
      userId,
      updates,
      updateKeys: Object.keys(updates),
      "hasIsFavorite": "is_favorite" in updates,
      "is_favorite": updates.is_favorite,
    });
    
    // Preserve is_favorite explicitly before encryption (it's not a sensitive field)
    // Handle both camelCase and snake_case
    const rawIsFavorite = updates.is_favorite !== undefined 
      ? updates.is_favorite 
      : (updates.isFavorite !== undefined ? updates.isFavorite : undefined);
    
    // Convert to proper boolean if provided - handle all possible values
    let finalIsFavorite: boolean | undefined = undefined;
    if (rawIsFavorite !== undefined && rawIsFavorite !== null) {
      if (rawIsFavorite === false || rawIsFavorite === "false" || rawIsFavorite === 0 || rawIsFavorite === "0") {
        finalIsFavorite = false;
      } else if (rawIsFavorite === true || rawIsFavorite === "true" || rawIsFavorite === 1 || rawIsFavorite === "1") {
        finalIsFavorite = true;
      } else {
        // For unknown values, default to false
        finalIsFavorite = false;
      }
    }
    
    console.log("🔍 Transaction.update - After conversion:", {
      rawIsFavorite,
      finalIsFavorite,
      "typeof finalIsFavorite": typeof finalIsFavorite,
    });
    
    const encryptedUpdates = encryptObject(Transaction.TABLE_NAME, updates);
    
    // Ensure is_favorite is included even if encryptObject removed it
    if (finalIsFavorite !== undefined) {
      encryptedUpdates.is_favorite = finalIsFavorite;
    }

    // Remove any undefined or null values from encryptedUpdates (except is_favorite which can be false)
    const cleanUpdates: any = {};
    Object.keys(encryptedUpdates).forEach(key => {
      const value = encryptedUpdates[key];
      // Include the field if it's not undefined/null, OR if it's is_favorite (which can be false)
      if (value !== undefined && value !== null) {
        cleanUpdates[key] = value;
      } else if (key === 'is_favorite' && value === false) {
        // Explicitly include is_favorite even if it's false
        cleanUpdates[key] = false;
      }
    });
    
    // Ensure is_favorite is explicitly set if it was provided
    if (finalIsFavorite !== undefined) {
      cleanUpdates.is_favorite = finalIsFavorite;
    }

    console.log("🔍 Transaction.update - Before Supabase update:", {
      encryptedUpdates,
      cleanUpdates,
      "hasIsFavorite": "is_favorite" in cleanUpdates,
      "is_favorite": cleanUpdates.is_favorite,
      "encryptedKeys": Object.keys(encryptedUpdates),
      "cleanKeys": Object.keys(cleanUpdates),
    });

    // Validate that we have something to update
    if (Object.keys(cleanUpdates).length === 0) {
      throw new Error("No valid fields to update");
    }

    // First, verify the transaction exists and belongs to the user
    const { data: existingTransaction, error: checkError } = await supabaseAdmin
      .from(Transaction.TABLE_NAME)
      .select("id")
      .eq("id", id)
      .eq("userId", userId)
      .single();

    if (checkError) {
      console.error("❌ Transaction.update - Transaction not found or access denied:", {
        message: checkError.message,
        code: checkError.code,
        id,
        userId,
      });
      throw new Error(`Transaction not found or you do not have permission to update it: ${checkError.message}`);
    }

    if (!existingTransaction) {
      throw new Error(`Transaction not found or you do not have permission to update it`);
    }

    // Now perform the update
    const { data, error } = await supabaseAdmin
      .from(Transaction.TABLE_NAME)
      .update(cleanUpdates)
      .eq("id", id)
      .eq("userId", userId)
      .select()
      .maybeSingle(); // Use maybeSingle() instead of single() to handle cases where no rows are returned

    if (error) {
      console.error("❌ Transaction.update - Supabase update error:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        cleanUpdates,
        id,
        userId,
      });
      throw new Error(`Error updating transaction: ${error.message} (Code: ${error.code}, Details: ${error.details || error.hint || 'No additional details'})`);
    }

    if (!data) {
      throw new Error(`Transaction was not updated - no data returned`);
    }

    // Decrypt sensitive fields but preserve is_favorite
    const decryptedData = decryptObject(Transaction.TABLE_NAME, data);
    
    // Ensure is_favorite is preserved
    if (data && data.is_favorite !== undefined) {
      decryptedData.is_favorite = data.is_favorite === true;
    }
    
    return decryptedData;
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
