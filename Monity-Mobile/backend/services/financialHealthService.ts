import { logger } from "../utils/logger";

interface Transaction {
  amount: number;
  typeId: number;
  category: string;
}

interface FinancialHealthSummary {
  savingsRate: number;
  expenseRatio: number;
  debtToIncomeRatio: number;
  netWorth: number;
}

interface FinancialHealthResult {
  score: number;
  category: string;
  recommendations: string[];
  summary: {
    savingsRate: string;
    expenseRatio: string;
    debtToIncomeRatio: string;
    netWorth: string;
  };
}

export default class FinancialHealthService {
  private supabase: any;

  constructor(supabase: any) {
    if (!supabase) {
      throw new Error("Supabase client is required.");
    }
    this.supabase = supabase;
  }

  async getFinancialHealthScore(
    userId: string
  ): Promise<FinancialHealthResult> {
    try {
      // This method requires fetching various pieces of financial data.
      // For now, we'll keep the direct Supabase queries for aggregation,
      // as this is a complex read operation that doesn't map to simple CRUD.

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: transactions, error } = await this.supabase
        .from("transactions")
        .select("amount, typeId, category")
        .eq("userId", userId)
        .gte("date", thirtyDaysAgo.toISOString());

      if (error) {
        logger.error("Error fetching transactions for financial health score", {
          userId,
          error,
        });
        throw new Error("Could not retrieve transaction data.");
      }

      const totalIncome = transactions
        .filter((t: Transaction) => t.typeId === 2)
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
      const totalExpenses = transactions
        .filter((t: Transaction) => t.typeId === 1)
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

      // Backward compatible savings calculation
      const totalSavings = transactions
        .filter((t: Transaction) => t.typeId === 3)
        .reduce((sum: number, t: Transaction) => {
          // Handle investment transactions (backward compatible)
          if (t.category === "Make Investments") {
            return sum - t.amount; // Subtract when moving to investments
          } else if (t.category === "Withdraw Investments") {
            return sum + t.amount; // Add when withdrawing from investments
          }

          // Default: regular savings (positive contribution)
          return sum + t.amount;
        }, 0);

      // Placeholder for liabilities and assets as these models don't exist yet
      const totalLiabilities = 0;
      const totalAssets = 0;

      const savingsRate = totalIncome > 0 ? totalSavings / totalIncome : 0;
      const expenseRatio = totalIncome > 0 ? totalExpenses / totalIncome : 1;
      const debtToIncomeRatio =
        totalIncome > 0 ? totalLiabilities / totalIncome : 1;
      const netWorth = totalAssets - totalLiabilities;

      let score = 0;

      // Scoring logic (simplified for brevity, can be expanded)
      if (savingsRate > 0.2) score += 30;
      else if (savingsRate > 0.1) score += 15;

      if (expenseRatio < 0.5) score += 30;
      else if (expenseRatio < 0.7) score += 15;

      if (debtToIncomeRatio < 0.3) score += 20;

      if (netWorth > 0) score += 20;

      const finalScore = Math.min(Math.round(score), 100);
      const category = this.getFinancialHealthCategory(finalScore);
      const recommendations = this.getFinancialHealthRecommendations({
        savingsRate,
        expenseRatio,
        debtToIncomeRatio,
        netWorth,
      });

      return {
        score: finalScore,
        category,
        recommendations,
        summary: {
          savingsRate: (savingsRate * 100).toFixed(2),
          expenseRatio: (expenseRatio * 100).toFixed(2),
          debtToIncomeRatio: (debtToIncomeRatio * 100).toFixed(2),
          netWorth: netWorth.toFixed(2),
        },
      };
    } catch (error: any) {
      logger.error("Error calculating financial health score", {
        userId,
        error: error.message,
      });
      throw new Error("Failed to calculate financial health score.");
    }
  }

  getFinancialHealthCategory(score: number): string {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Improvement";
  }

  getFinancialHealthRecommendations(summary: FinancialHealthSummary): string[] {
    const recommendations: string[] = [];
    if (summary.expenseRatio >= 1) {
      recommendations.push(
        "Your expenses are higher than your income. Review your spending to find areas to cut back."
      );
    }
    if (summary.savingsRate < 0.1) {
      recommendations.push(
        "Try to save at least 10% of your income. Automating savings can help."
      );
    }
    if (summary.debtToIncomeRatio > 0.4) {
      recommendations.push(
        "A high debt-to-income ratio can be risky. Consider strategies to pay down your debt faster."
      );
    }
    if (recommendations.length === 0) {
      recommendations.push(
        "You are doing great! Keep up the good work and continue to monitor your financial health."
      );
    }
    return recommendations;
  }
}
