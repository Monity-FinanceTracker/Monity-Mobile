/**
 * Migration script to populate categoryId in existing transactions
 * 
 * This script:
 * 1. Fetches all transactions without categoryId
 * 2. For each transaction, decrypts the category name
 * 3. Finds the matching category by name for that user
 * 4. Updates the transaction with the categoryId
 * 
 * Run this script once after adding the categoryId column to the transactions table.
 * 
 * Usage:
 *   npx ts-node backend/migrations/populate_category_id.ts
 * 
 * Or compile and run:
 *   npm run build
 *   node dist/migrations/populate_category_id.js
 */

import { supabaseAdmin } from "../config";
import Transaction from "../models/Transaction";
import Category from "../models/Category";
import { decryptObject } from "../middleware/encryption";

async function populateCategoryIds() {
  console.log("🚀 Starting migration to populate categoryId in transactions...\n");

  try {
    // Get all unique user IDs from transactions
    const { data: usersData, error: usersError } = await supabaseAdmin
      .from("transactions")
      .select("userId")
      .not("userId", "is", null);

    if (usersError) {
      throw new Error(`Error fetching users: ${usersError.message}`);
    }

    const uniqueUserIds = [...new Set(usersData.map((u: any) => u.userId))];
    console.log(`📊 Found ${uniqueUserIds.length} unique users with transactions\n`);

    let totalProcessed = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    // Process each user
    for (const userId of uniqueUserIds) {
      console.log(`\n👤 Processing user: ${userId}`);

      try {
        // Get all transactions for this user without categoryId
        const { data: transactionsData, error: transactionsError } = await supabaseAdmin
          .from("transactions")
          .select("*")
          .eq("userId", userId)
          .is("categoryId", null);

        if (transactionsError) {
          console.error(`❌ Error fetching transactions for user ${userId}:`, transactionsError.message);
          totalErrors++;
          continue;
        }

        if (!transactionsData || transactionsData.length === 0) {
          console.log(`   ✅ No transactions without categoryId for this user`);
          continue;
        }

        console.log(`   📝 Found ${transactionsData.length} transactions without categoryId`);

        // Get all categories for this user (decrypted)
        const categories = await Category.findByUser(userId);
        console.log(`   📂 Found ${categories.length} categories for this user`);

        // Create a map of category name to category ID for quick lookup
        const categoryMap = new Map<string, string>();
        categories.forEach((cat: any) => {
          if (cat.name && cat.id) {
            categoryMap.set(cat.name.toLowerCase().trim(), cat.id);
          }
        });

        // Process each transaction
        for (const transaction of transactionsData) {
          totalProcessed++;

          try {
            // Decrypt the transaction to get the category name
            const decryptedTransaction = decryptObject("transactions", transaction);
            const categoryName = decryptedTransaction.category || decryptedTransaction.category_name;

            if (!categoryName) {
              console.log(`   ⚠️  Transaction ${transaction.id}: No category name found, skipping`);
              totalSkipped++;
              continue;
            }

            // Find matching category (case-insensitive)
            const categoryId = categoryMap.get(categoryName.toLowerCase().trim());

            if (!categoryId) {
              console.log(`   ⚠️  Transaction ${transaction.id}: Category "${categoryName}" not found, skipping`);
              totalSkipped++;
              continue;
            }

            // Update the transaction with categoryId
            const { error: updateError } = await supabaseAdmin
              .from("transactions")
              .update({ categoryId })
              .eq("id", transaction.id)
              .eq("userId", userId);

            if (updateError) {
              console.error(`   ❌ Error updating transaction ${transaction.id}:`, updateError.message);
              totalErrors++;
              continue;
            }

            totalUpdated++;
            if (totalUpdated % 10 === 0) {
              console.log(`   ✅ Updated ${totalUpdated} transactions so far...`);
            }
          } catch (error: any) {
            console.error(`   ❌ Error processing transaction ${transaction.id}:`, error.message);
            totalErrors++;
          }
        }

        console.log(`   ✅ Completed user ${userId}: ${totalUpdated} updated, ${totalSkipped} skipped, ${totalErrors} errors`);
      } catch (error: any) {
        console.error(`❌ Error processing user ${userId}:`, error.message);
        totalErrors++;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 Migration Summary:");
    console.log("=".repeat(60));
    console.log(`   Total transactions processed: ${totalProcessed}`);
    console.log(`   ✅ Successfully updated: ${totalUpdated}`);
    console.log(`   ⚠️  Skipped (no matching category): ${totalSkipped}`);
    console.log(`   ❌ Errors: ${totalErrors}`);
    console.log("=".repeat(60));
    console.log("\n✅ Migration completed!");

    if (totalErrors > 0) {
      console.log(`\n⚠️  Warning: ${totalErrors} errors occurred during migration. Please review the logs above.`);
      process.exit(1);
    }
  } catch (error: any) {
    console.error("\n❌ Fatal error during migration:", error);
    process.exit(1);
  }
}

// Run the migration
populateCategoryIds()
  .then(() => {
    console.log("\n🎉 Migration script finished successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Migration script failed:", error);
    process.exit(1);
  });

