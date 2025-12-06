import ScheduledTransaction from "../models/ScheduledTransaction";
import Transaction from "../models/Transaction";
import { logger } from "../utils/logger";

export default class ScheduledTransactionService {
  private isInitialized: boolean = false;
  private isProcessing: boolean = false;

  /**
   * Initialize the scheduled transaction service
   * Note: Cron job setup would be done here, but for mobile backend
   * we'll rely on external cron or scheduled tasks
   */
  initialize() {
    if (this.isInitialized) {
      logger.info("[ScheduledTransactionService] Already initialized");
      return;
    }

    try {
      logger.info("[ScheduledTransactionService] Initializing...");
      // For mobile backend, we'll execute manually or via external cron
      // The cron job would be: '1 0 * * *' (daily at 00:01 UTC)
      this.isInitialized = true;
      logger.info(
        "[ScheduledTransactionService] Initialized successfully. Execute manually or via external cron."
      );
    } catch (error: any) {
      logger.error("[ScheduledTransactionService] Failed to initialize:", {
        error: error.message,
      });
    }
  }

  /**
   * Execute all scheduled transactions that are due
   */
  async executeScheduledTransactions() {
    // Prevent concurrent executions
    if (this.isProcessing) {
      logger.warn(
        "[ScheduledTransactionService] Already processing scheduled transactions, skipping this run"
      );
      return {
        success: false,
        message: "Processing already in progress",
        processed: 0,
      };
    }

    this.isProcessing = true;
    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of day

      const dueTransactions = await ScheduledTransaction.getAllDueTransactions(
        today
      );

      logger.info(
        `[ScheduledTransactionService] Found ${dueTransactions.length} transactions to execute`
      );

      for (const scheduledTxn of dueTransactions) {
        try {
          const result = await this.executeTransaction(scheduledTxn);
          if (result.created) {
            processedCount++;
          } else {
            skippedCount++;
          }
        } catch (error: any) {
          errorCount++;
          logger.error(
            `[ScheduledTransactionService] Failed to execute transaction ${scheduledTxn.id}:`,
            {
              error: error.message,
            }
          );
        }
      }

      logger.info(
        `[ScheduledTransactionService] Execution complete: ${processedCount} processed, ${skippedCount} skipped, ${errorCount} errors`
      );

      return {
        success: true,
        processed: processedCount,
        skipped: skippedCount,
        errors: errorCount,
      };
    } catch (error: any) {
      logger.error(
        "[ScheduledTransactionService] Error executing scheduled transactions:",
        {
          error: error.message,
        }
      );
      return {
        success: false,
        message: error.message,
        processed: processedCount,
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute a single scheduled transaction
   */
  private async executeTransaction(scheduledTxn: any) {
    try {
      // Create the actual transaction
      const transactionData = {
        userId: scheduledTxn.userId,
        description: scheduledTxn.description,
        amount: scheduledTxn.amount,
        category: scheduledTxn.category,
        typeId: scheduledTxn.typeId,
        date: scheduledTxn.next_execution_date,
      };

      await Transaction.create(transactionData);

      // Calculate next execution date based on recurrence pattern
      const nextDate = this.calculateNextExecutionDate(
        scheduledTxn.next_execution_date,
        scheduledTxn.recurrence_pattern,
        scheduledTxn.recurrence_interval || 1,
        scheduledTxn.recurrence_end_date
      );

      if (nextDate) {
        // Update scheduled transaction with next execution date
        await ScheduledTransaction.update(scheduledTxn.id, scheduledTxn.userId, {
          last_executed_date: scheduledTxn.next_execution_date,
          next_execution_date: nextDate,
        });
      } else {
        // No more executions - deactivate
        await ScheduledTransaction.deactivate(
          scheduledTxn.id,
          scheduledTxn.userId
        );
      }

      return { created: true };
    } catch (error: any) {
      logger.error(
        "[ScheduledTransactionService] Error executing transaction:",
        {
          error: error.message,
        }
      );
      throw error;
    }
  }

  /**
   * Calculate next execution date based on recurrence pattern
   */
  private calculateNextExecutionDate(
    currentDate: string,
    pattern: string,
    interval: number = 1,
    endDate?: string
  ): string | null {
    const current = new Date(currentDate);
    let next = new Date(current);

    switch (pattern) {
      case "once":
        return null; // One-time transaction, no next date
      case "daily":
        next.setDate(next.getDate() + interval);
        break;
      case "weekly":
        next.setDate(next.getDate() + 7 * interval);
        break;
      case "monthly":
        next.setMonth(next.getMonth() + interval);
        break;
      case "quarterly":
        next.setMonth(next.getMonth() + 3 * interval);
        break;
      case "yearly":
        next.setFullYear(next.getFullYear() + interval);
        break;
      default:
        return null;
    }

    // Check if we've passed the end date
    if (endDate) {
      const end = new Date(endDate);
      if (next > end) {
        return null;
      }
    }

    return next.toISOString().split("T")[0];
  }
}

