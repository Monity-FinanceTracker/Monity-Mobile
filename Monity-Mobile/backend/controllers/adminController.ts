import { logger } from "../utils/logger";
import { supabaseAdmin } from "../config/supabase";
import type { Request, Response, NextFunction } from "express";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    [key: string]: any;
  };
}

export default class AdminController {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabaseAdmin;
  }

  async getSystemHealth(req: AuthenticatedRequest, res: Response) {
    try {
      const healthChecks: any = {};
      const startTime = Date.now();

      // Check Supabase database connection and performance
      const dbStartTime = Date.now();
      const { data: profileCheck, error: profileError } = await this.supabase
        .from("profiles")
        .select("id")
        .limit(1);

      const dbResponseTime = Date.now() - dbStartTime;

      if (profileError) {
        healthChecks.database = {
          status: "error",
          responseTime: dbResponseTime,
          error: profileError as Error["message"],
        };
      } else {
        healthChecks.database = {
          status: "healthy",
          responseTime: dbResponseTime,
          uptime: "99.9%", // This would come from monitoring in production
        };
      }

      // Check API performance with a simple query
      const apiStartTime = Date.now();
      const { data: transactionCheck, error: transactionError } =
        await this.supabase.from("transactions").select("id").limit(5);

      const apiResponseTime = Date.now() - apiStartTime;

      if (transactionError) {
        healthChecks.api = {
          status: "error",
          responseTime: apiResponseTime,
          error: transactionError as Error["message"],
        };
      } else {
        healthChecks.api = {
          status: "healthy",
          responseTime: apiResponseTime,
          avgResponseTime:
            apiResponseTime < 100 ? "<100ms" : `${apiResponseTime}ms`,
        };
      }

      // Check user sessions (active users in the last 24 hours)
      const sessionStartTime = Date.now();
      const yesterday = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString();

      const { data: recentTransactions, error: sessionError } =
        await this.supabase
          .from("transactions")
          .select("userId")
          .gte("date", yesterday);

      const sessionResponseTime = Date.now() - sessionStartTime;

      if (sessionError) {
        healthChecks.userSessions = {
          status: "error",
          responseTime: sessionResponseTime,
          error: sessionError as Error["message"],
        };
      } else {
        const activeUsers = new Set(
          recentTransactions.map((t: any) => t.userId)
        );
        healthChecks.userSessions = {
          status: "healthy",
          responseTime: sessionResponseTime,
          activeUsers: activeUsers.size,
          value: `${activeUsers.size} active`,
        };
      }

      // Check data processing performance
      const processingStartTime = Date.now();
      const { data: categoryData, error: categoryError } = await this.supabase
        .from("categories")
        .select("id")
        .limit(1);

      const processingResponseTime = Date.now() - processingStartTime;

      if (categoryError) {
        healthChecks.dataProcessing = {
          status: "error",
          responseTime: processingResponseTime,
          error: categoryError as Error["message"],
        };
      } else {
        healthChecks.dataProcessing = {
          status: "healthy",
          responseTime: processingResponseTime,
          value: "Real-time",
        };
      }

      const totalResponseTime = Date.now() - startTime;
      const overallStatus = Object.values(healthChecks).every(
        (check: any) => check.status === "healthy"
      )
        ? "ok"
        : "degraded";

      res.json({
        status: overallStatus,
        timestamp: new Date().toISOString(),
        totalResponseTime,
        checks: healthChecks,
        metrics: {
          avgDatabaseResponseTime: healthChecks.database.responseTime,
          avgApiResponseTime: healthChecks.api.responseTime,
          activeUsers: healthChecks.userSessions.activeUsers || 0,
          systemLoad: "Normal", // This would come from system monitoring
        },
      });
    } catch (error) {
      logger.error("System health check failed", {
        error: error as Error["message"],
      });
      res.status(503).json({
        status: "error",
        timestamp: new Date().toISOString(),
        error: "One or more systems are down.",
        details: error as Error["message"],
        totalResponseTime: Date.now() - (res.locals.startTime || Date.now()),
      });
    }
  }

  async getUserStats(req: AuthenticatedRequest, res: Response) {
    try {
      const [usersResult, premiumUsersResult] = await Promise.all([
        this.supabase
          .from("profiles")
          .select("*", { count: "exact", head: true }),
        this.supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("subscription_tier", "premium"),
      ]);

      if (usersResult.error) throw usersResult.error;
      if (premiumUsersResult.error) throw premiumUsersResult.error;

      const totalUsers = usersResult.count || 0;
      const premiumUsers = premiumUsersResult.count || 0;

      res.json({
        totalUsers,
        premiumUsers,
        freeUsers: totalUsers - premiumUsers,
      });
    } catch (error) {
      logger.error("Failed to get user stats", {
        error: error as Error["message"],
      });
      res.status(500).json({ error: "Failed to fetch user statistics" });
    }
  }

  async getAnalytics(req: AuthenticatedRequest, res: Response) {
    try {
      // --- User Analytics ---
      // Fetch all users from Auth, handling pagination
      let allAuthUsers: any[] = [];
      let page = 1;
      const perPage = 1000;
      let hasMore = true;

      while (hasMore) {
        const {
          data: { users },
          error,
        } = await this.supabase.auth.admin.listUsers({ page, perPage });
        if (error) throw error;

        if (users.length > 0) {
          allAuthUsers = allAuthUsers.concat(users);
          page++;
        } else {
          hasMore = false;
        }
      }

      // Fetch all profiles
      const { data: profilesData, error: profilesError } = await this.supabase
        .from("profiles")
        .select("id, subscription_tier");

      if (profilesError) throw profilesError;

      // Create a map for easy lookup
      const profilesMap = profilesData.reduce((map: any, profile: any) => {
        map[profile.id] = profile.subscription_tier;
        return map;
      }, {});

      const totalUsers = allAuthUsers.length;
      let premiumUsers = 0;
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      let recentSignups = 0;

      for (const user of allAuthUsers) {
        if (profilesMap[user.id] === "premium") {
          premiumUsers++;
        }
        if (new Date(user.created_at) > thirtyDaysAgo) {
          recentSignups++;
        }
      }

      // --- Transaction Analytics ---
      const { data: transactionsData, error: transactionsError } =
        await this.supabase
          .from("transactions")
          .select("amount, typeId, category");

      if (transactionsError) throw transactionsError;

      const totalTransactions = transactionsData.length;
      const totalVolume = transactionsData.reduce(
        (sum: any, t: any) => sum + Math.abs(t.amount),
        0
      );

      const transactionsByType = transactionsData.reduce(
        (acc: any, t: any) => {
          if (t.typeId === 1) {
            acc.expenses += Math.abs(t.amount);
          } else if (t.typeId === 2) {
            acc.income += t.amount;
          } else if (t.typeId === 3) {
            // Backward compatible savings calculation
            if (t.category === "Make Investments") {
              acc.savings -= t.amount; // Subtract when moving to investments
            } else if (t.category === "Withdraw Investments") {
              acc.savings += t.amount; // Add when withdrawing from investments
            } else {
              acc.savings += t.amount; // Regular savings
            }
          }
          return acc;
        },
        { income: 0, expenses: 0, savings: 0 }
      );

      // --- Category Analytics ---
      const { data: categoriesData, error: categoriesError } =
        await this.supabase.from("categories").select("id");

      if (categoriesError) throw categoriesError;

      const categoryCounts = transactionsData.reduce((acc: any, t: any) => {
        if (t.category) {
          acc[t.category] = (acc[t.category] || 0) + 1;
        }
        return acc;
      }, {});

      const topCategoriesData = Object.entries(categoryCounts)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 9)
        .map(([category, usage_count]) => ({ category, usage_count }));

      // --- Growth Analytics ---
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      const twelveMonthsAgo = new Date(
        now.getFullYear(),
        now.getMonth() - 12,
        1
      );

      // Monthly growth data
      const monthlyGrowthMap: any = {};
      const monthlyTransactionMap: any = {};
      const monthlyRevenueMap: any = {};

      // Initialize last 12 months
      for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
        monthlyGrowthMap[monthKey] = 0;
        monthlyTransactionMap[monthKey] = 0;
        monthlyRevenueMap[monthKey] = 0;
      }

      // Count users by month
      allAuthUsers.forEach((user: any) => {
        const month = new Date(user.created_at).toISOString().slice(0, 7);
        if (monthlyGrowthMap.hasOwnProperty(month)) {
          monthlyGrowthMap[month]++;
        }
      });

      // Count transactions by month
      transactionsData.forEach((transaction: any) => {
        if (transaction.date) {
          const month = transaction.date.slice(0, 7); // YYYY-MM
          if (monthlyTransactionMap.hasOwnProperty(month)) {
            monthlyTransactionMap[month]++;
            monthlyRevenueMap[month] += Math.abs(transaction.amount);
          }
        }
      });

      const monthlyGrowth = Object.entries(monthlyGrowthMap)
        .map(([month, new_users]) => ({
          month: `${month}-01`,
          new_users,
          transactions: monthlyTransactionMap[month] || 0,
          revenue: monthlyRevenueMap[month] || 0,
        }))
        .sort(
          (a: any, b: any) =>
            new Date(a.month).getTime() - new Date(b.month).getTime()
        );

      // Weekly growth data (last 12 weeks)
      const weeklyGrowthMap: any = {};
      const weeklyTransactionMap: any = {};

      // Initialize last 12 weeks
      for (let i = 0; i < 12; i++) {
        const date = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const weekStart = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate() - date.getDay()
        );
        const weekKey = weekStart.toISOString().slice(0, 10); // YYYY-MM-DD
        weeklyGrowthMap[weekKey] = 0;
        weeklyTransactionMap[weekKey] = 0;
      }

      // Count users by week
      allAuthUsers.forEach((user: any) => {
        const userDate = new Date(user.created_at);
        const weekStart = new Date(
          userDate.getFullYear(),
          userDate.getMonth(),
          userDate.getDate() - userDate.getDay()
        );
        const weekKey = weekStart.toISOString().slice(0, 10);
        if (weeklyGrowthMap.hasOwnProperty(weekKey)) {
          weeklyGrowthMap[weekKey]++;
        }
      });

      // Count transactions by week
      transactionsData.forEach((transaction: any) => {
        if (transaction.date) {
          const transactionDate = new Date(transaction.date);
          const weekStart = new Date(
            transactionDate.getFullYear(),
            transactionDate.getMonth(),
            transactionDate.getDate() - transactionDate.getDay()
          );
          const weekKey = weekStart.toISOString().slice(0, 10);
          if (weeklyTransactionMap.hasOwnProperty(weekKey)) {
            weeklyTransactionMap[weekKey]++;
          }
        }
      });

      const weeklyGrowth = Object.entries(weeklyGrowthMap)
        .map(([week, new_users]) => ({
          week,
          new_users,
          transactions: weeklyTransactionMap[week] || 0,
        }))
        .sort(
          (a: any, b: any) =>
            new Date(a.week).getTime() - new Date(b.week).getTime()
        );

      // Calculate growth rates
      const currentMonthUsers =
        monthlyGrowth[monthlyGrowth.length - 1]?.new_users || 0;
      const previousMonthUsers =
        monthlyGrowth[monthlyGrowth.length - 2]?.new_users || 0;
      const monthOverMonthGrowth = (((previousMonthUsers as number) > 0) as any)
        ? (
            (((currentMonthUsers as number) - (previousMonthUsers as number)) /
              (previousMonthUsers as number)) *
            100
          ).toFixed(1)
        : 0;

      const currentWeekUsers =
        weeklyGrowth[weeklyGrowth.length - 1]?.new_users || 0;
      const previousWeekUsers =
        weeklyGrowth[weeklyGrowth.length - 2]?.new_users || 0;
      const weekOverWeekUserGrowth = (((previousWeekUsers as number) >
        0) as any)
        ? (
            (((currentWeekUsers as number) - (previousWeekUsers as number)) /
              (previousWeekUsers as number)) *
            100
          ).toFixed(1)
        : 0;

      res.json({
        users: {
          total: totalUsers,
          premium: premiumUsers,
          free: totalUsers - premiumUsers,
          recentSignups,
        },
        transactions: {
          total: totalTransactions,
          totalVolume,
          byType: transactionsByType,
        },
        categories: {
          total: categoriesData.length,
          topUsed: topCategoriesData,
        },
        growth: {
          monthlyData: monthlyGrowth,
          weeklyData: weeklyGrowth,
          trends: {
            monthOverMonthGrowth: parseFloat(monthOverMonthGrowth.toString()),
            weekOverWeekUserGrowth: parseFloat(
              weekOverWeekUserGrowth.toString()
            ),
            currentMonthUsers,
            previousMonthUsers,
            currentWeekUsers,
            previousWeekUsers,
          },
        },
      });
    } catch (error) {
      logger.error("Failed to get platform analytics", {
        error: error as Error["message"],
      });
      res.status(500).json({ error: "Failed to fetch platform analytics" });
    }
  }

  async getTrends(req: AuthenticatedRequest, res: Response) {
    try {
      const days = parseInt(req.query.days as string, 10) || 30;
      const dateFrom = new Date(
        Date.now() - days * 24 * 60 * 60 * 1000
      ).toISOString();

      // Fetch transactions within the date range
      const { data: transactions, error } = await this.supabase
        .from("transactions")
        .select("userId, amount, date, typeId")
        .gte("date", dateFrom)
        .order("date", { ascending: true });

      if (error) throw error;

      const activeUsers = new Set(transactions.map((t: any) => t.userId));
      const totalVolume = transactions.reduce(
        (sum: any, t: any) => sum + Math.abs(t.amount),
        0
      );

      // Calculate daily trends
      const dailyTrendsMap: any = {};

      // Initialize all days in the range
      for (let i = 0; i < days; i++) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split("T")[0];
        dailyTrendsMap[dateStr] = {
          date: dateStr,
          transactions: 0,
          volume: 0,
          activeUsers: new Set(),
          income: 0,
          expenses: 0,
          savings: 0,
        };
      }

      // Populate with actual data
      transactions.forEach((transaction: any) => {
        const dateStr = transaction.date.split("T")[0];
        if (dailyTrendsMap[dateStr]) {
          const day = dailyTrendsMap[dateStr];
          day.transactions++;
          day.volume += Math.abs(transaction.amount);
          day.activeUsers.add(transaction.userId);

          if (transaction.typeId === 1) {
            day.income += transaction.amount;
          } else if (transaction.typeId === 2) {
            day.expenses += Math.abs(transaction.amount);
          } else if (transaction.typeId === 3) {
            day.savings += transaction.amount;
          }
        }
      });

      // Convert to array and format for frontend
      const dailyTrends = Object.values(dailyTrendsMap)
        .map((day: any) => ({
          ...day,
          activeUsers: day.activeUsers.size,
        }))
        .sort(
          (a: any, b: any) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

      // Calculate week-over-week and month-over-month trends
      const currentWeekTransactions = transactions.filter((t: any) => {
        const transactionDate = new Date(t.date);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return transactionDate >= weekAgo;
      }).length;

      const previousWeekTransactions = transactions.filter((t: any) => {
        const transactionDate = new Date(t.date);
        const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return transactionDate >= twoWeeksAgo && transactionDate < weekAgo;
      }).length;

      const weekOverWeekGrowth = (((previousWeekTransactions as number) >
        0) as any)
        ? (
            (((currentWeekTransactions as number) -
              (previousWeekTransactions as number)) /
              previousWeekTransactions) *
            100
          ).toFixed(1)
        : 0;

      res.json({
        summary: {
          totalActiveUsers: activeUsers.size,
          avgDailyTransactions: parseFloat(
            (transactions.length / days).toFixed(1) as any
          ),
          avgDailyVolume: parseFloat((totalVolume / days).toFixed(2)),
          weekOverWeekGrowth: parseFloat(weekOverWeekGrowth.toString()),
          totalTransactions: transactions.length,
          totalVolume: parseFloat(totalVolume.toFixed(2)),
        },
        dailyTrends,
        periodData: {
          currentWeekTransactions,
          previousWeekTransactions,
          weekOverWeekGrowth: parseFloat(weekOverWeekGrowth.toString()),
        },
      });
    } catch (error) {
      logger.error("Failed to get trends data", {
        error: error as Error["message"],
      });
      res.status(500).json({ error: "Failed to fetch trends data" });
    }
  }

  async getFinancialHealthMetrics(req: AuthenticatedRequest, res: Response) {
    try {
      // Get all user transactions for financial health analysis
      const { data: allTransactions, error: transactionsError } =
        await this.supabase
          .from("transactions")
          .select("userId, amount, typeId, date");

      if (transactionsError) throw transactionsError;

      // Get all users
      const { data: profiles, error: profilesError } = await this.supabase
        .from("profiles")
        .select("id, subscription_tier");

      if (profilesError) throw profilesError;

      // Calculate financial health metrics per user
      const userFinancialHealth: any = {};
      const healthCategories = {
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0,
      };

      profiles.forEach((profile: any) => {
        const userId = profile.id;
        const userTransactions = allTransactions.filter(
          (t: any) => t.userId === userId
        );

        if (userTransactions.length === 0) {
          userFinancialHealth[userId as keyof typeof userFinancialHealth] = {
            score: 0,
            category: "poor" as any,
          };
          healthCategories.poor++;
          return;
        }

        // Calculate basic financial metrics
        const totalIncome = userTransactions
          .filter((t: any) => t.typeId === 1)
          .reduce((sum: any, t: any) => sum + t.amount, 0);

        const totalExpenses = userTransactions
          .filter((t: any) => t.typeId === 2)
          .reduce((sum: any, t: any) => sum + Math.abs(t.amount), 0);

        const totalSavings = userTransactions
          .filter((t: any) => t.typeId === 3)
          .reduce((sum: any, t: any) => sum + t.amount, 0);

        // Calculate savings rate
        const savingsRate =
          totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

        // Calculate expense ratio
        const expenseRatio =
          totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 100;

        // Simple health score calculation (0-100)
        let healthScore = 50; // Base score

        // Adjust based on savings rate
        if (savingsRate >= 20) healthScore += 30;
        else if (savingsRate >= 10) healthScore += 20;
        else if (savingsRate >= 5) healthScore += 10;
        else if (savingsRate < 0) healthScore -= 20;

        // Adjust based on expense ratio
        if (expenseRatio <= 50) healthScore += 20;
        else if (expenseRatio <= 70) healthScore += 10;
        else if (expenseRatio <= 90) healthScore += 0;
        else healthScore -= 20;

        // Ensure score is within bounds
        healthScore = Math.max(0, Math.min(100, healthScore));

        // Categorize health
        let category;
        if (healthScore >= 80) category = "excellent";
        else if (healthScore >= 60) category = "good";
        else if (healthScore >= 40) category = "fair";
        else category = "poor";

        userFinancialHealth[userId as keyof typeof userFinancialHealth] = {
          score: healthScore as any,
          category: category as any,
          savingsRate: parseFloat(savingsRate.toFixed(2)),
          expenseRatio: parseFloat(expenseRatio.toFixed(2)),
          totalIncome: totalIncome as any,
          totalExpenses: totalExpenses as any,
          totalSavings: totalSavings as any,
        };

        healthCategories[category as keyof typeof healthCategories]++;
      });

      // Calculate aggregate metrics
      const healthScores = Object.values(userFinancialHealth).map(
        (h: any) => h.score
      );
      const avgHealthScore =
        healthScores.length > 0
          ? healthScores.reduce((sum: any, score: any) => sum + score, 0) /
            healthScores.length
          : 0;

      const avgSavingsRate = Object.values(userFinancialHealth)
        .filter((h: any) => h.savingsRate !== undefined)
        .reduce(
          (sum: any, h: any, _, arr: any) => sum + h.savingsRate / arr.length,
          0
        ) as number;

      const avgExpenseRatio = Object.values(userFinancialHealth)
        .filter((h: any) => h.expenseRatio !== undefined)
        .reduce(
          (sum: any, h: any, _, arr: any) => sum + h.expenseRatio / arr.length,
          0
        ) as number;

      // Platform-wide financial metrics
      const platformTotalIncome = allTransactions
        .filter((t: any) => t.typeId === 1)
        .reduce((sum: any, t: any) => sum + t.amount, 0);

      const platformTotalExpenses = allTransactions
        .filter((t: any) => t.typeId === 2)
        .reduce((sum: any, t: any) => sum + Math.abs(t.amount), 0);

      const platformTotalSavings = allTransactions
        .filter((t: any) => t.typeId === 3)
        .reduce((sum: any, t: any) => sum + t.amount, 0);

      res.json({
        overview: {
          avgHealthScore: parseFloat(avgHealthScore.toFixed(2)),
          avgSavingsRate: parseFloat(avgSavingsRate.toFixed(2)),
          avgExpenseRatio: parseFloat(avgExpenseRatio.toFixed(2)),
          totalUsers: profiles.length,
          usersWithTransactions: Object.keys(userFinancialHealth).length,
        },
        healthDistribution: healthCategories,
        platformMetrics: {
          totalIncome: platformTotalIncome,
          totalExpenses: platformTotalExpenses,
          totalSavings: platformTotalSavings,
          platformSavingsRate:
            platformTotalIncome > 0
              ? parseFloat(
                  ((platformTotalSavings / platformTotalIncome) * 100).toFixed(
                    2
                  )
                )
              : 0,
        },
        trends: {
          improvingUsers: Object.values(userFinancialHealth).filter(
            (h: any) => h.score >= 60
          ).length,
          riskyUsers: Object.values(userFinancialHealth).filter(
            (h: any) => h.score < 40
          ).length,
          healthySpenders: Object.values(userFinancialHealth).filter(
            (h: any) => h.expenseRatio <= 70
          ).length,
        },
      });
    } catch (error) {
      logger.error("Failed to get financial health metrics", {
        error: error as Error["message"],
      });
      res
        .status(500)
        .json({ error: "Failed to fetch financial health metrics" });
    }
  }
}

// Export is already handled by export default class
