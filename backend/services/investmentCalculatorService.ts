import { logger } from "../utils/logger";

export default class InvestmentCalculatorService {
  /**
   * Validate input parameters
   */
  validateParameters(params: {
    initialInvestment: number;
    contributionAmount: number;
    contributionFrequency: string;
    annualInterestRate: number;
    goalDate: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (params.initialInvestment < 0) {
      errors.push("Initial investment cannot be negative");
    }

    if (params.contributionAmount < 0) {
      errors.push("Contribution amount cannot be negative");
    }

    if (!["monthly", "semi-annually", "annually"].includes(params.contributionFrequency)) {
      errors.push("Invalid contribution frequency");
    }

    if (params.annualInterestRate < 0 || params.annualInterestRate > 100) {
      errors.push("Annual interest rate must be between 0 and 100");
    }

    const goalDate = new Date(params.goalDate);
    const now = new Date();
    if (goalDate <= now) {
      errors.push("Goal date must be in the future");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate compound interest with regular contributions
   */
  calculateCompoundInterest(params: {
    initialInvestment: number;
    contributionAmount: number;
    contributionFrequency: string;
    annualInterestRate: number;
    goalDate: string;
  }) {
    const {
      initialInvestment,
      contributionAmount,
      contributionFrequency,
      annualInterestRate,
      goalDate,
    } = params;

    // Convert inputs
    const P = parseFloat(String(initialInvestment)) || 0;
    const PMT = parseFloat(String(contributionAmount)) || 0;
    const r = parseFloat(String(annualInterestRate)) / 100; // Convert percentage to decimal

    // Calculate time period in years
    const now = new Date();
    const goal = new Date(goalDate);
    const diffTime = Math.abs(goal.getTime() - now.getTime());
    const t = diffTime / (1000 * 60 * 60 * 24 * 365.25); // Years including leap years

    // Determine compounding frequency and contribution periods per year
    let n = 12; // Default to monthly compounding
    let contributionsPerYear: number;

    switch (contributionFrequency) {
      case "monthly":
        contributionsPerYear = 12;
        n = 12;
        break;
      case "semi-annually":
        contributionsPerYear = 2;
        n = 12; // Still compound monthly for accuracy
        break;
      case "annually":
        contributionsPerYear = 1;
        n = 12; // Still compound monthly for accuracy
        break;
      default:
        contributionsPerYear = 12;
    }

    // Calculate future value of initial investment: FV_principal = P(1 + r/n)^(nt)
    const principalGrowth = P * Math.pow(1 + r / n, n * t);

    // Calculate future value of regular contributions
    let contributionsGrowth = 0;
    const totalPeriods = Math.floor(t * contributionsPerYear);

    for (let i = 0; i < totalPeriods; i++) {
      // Time remaining for this contribution to grow
      const timeRemaining = t - i / contributionsPerYear;
      contributionsGrowth += PMT * Math.pow(1 + r / n, n * timeRemaining);
    }

    // Total future value
    const finalValue = principalGrowth + contributionsGrowth;

    // Total contributions (initial + regular contributions)
    const totalContributions = P + PMT * totalPeriods;

    // Total interest earned
    const totalInterest = finalValue - totalContributions;

    // Return on Investment percentage
    const roiPercentage =
      totalContributions > 0 ? (totalInterest / totalContributions) * 100 : 0;

    return {
      finalValue: Math.round(finalValue * 100) / 100,
      totalContributions: Math.round(totalContributions * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      roiPercentage: Math.round(roiPercentage * 100) / 100,
      years: Math.round(t * 100) / 100,
      totalPeriods,
    };
  }

  /**
   * Generate growth data for charting
   */
  generateGrowthData(
    params: {
      initialInvestment: number;
      contributionAmount: number;
      contributionFrequency: string;
      annualInterestRate: number;
      goalDate: string;
    },
    viewType: string = "monthly"
  ) {
    const {
      initialInvestment,
      contributionAmount,
      contributionFrequency,
      annualInterestRate,
      goalDate,
    } = params;

    const P = parseFloat(String(initialInvestment)) || 0;
    const PMT = parseFloat(String(contributionAmount)) || 0;
    const r = parseFloat(String(annualInterestRate)) / 100;

    const now = new Date();
    const goal = new Date(goalDate);
    const diffTime = Math.abs(goal.getTime() - now.getTime());
    const totalYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);

    const n = 12; // Monthly compounding
    let contributionsPerYear: number;

    switch (contributionFrequency) {
      case "monthly":
        contributionsPerYear = 12;
        break;
      case "semi-annually":
        contributionsPerYear = 2;
        break;
      case "annually":
        contributionsPerYear = 1;
        break;
      default:
        contributionsPerYear = 12;
    }

    const dataPoints: Array<{
      time: string;
      principal: number;
      contributions: number;
      interest: number;
      total: number;
    }> = [];
    let intervals: number;
    let intervalYears: number;

    if (viewType === "monthly") {
      intervals = Math.min(Math.ceil(totalYears * 12), 360); // Cap at 30 years
      intervalYears = 1 / 12;
    } else {
      intervals = Math.min(Math.ceil(totalYears), 30); // Cap at 30 years
      intervalYears = 1;
    }

    // Add initial point
    dataPoints.push({
      time: now.toISOString().split("T")[0],
      principal: P,
      contributions: 0,
      interest: 0,
      total: P,
    });

    let currentPrincipal = P;
    let totalContributions = P;
    let contributionCount = 0;

    for (let i = 1; i <= intervals; i++) {
      const timeElapsed = i * intervalYears;
      const currentDate = new Date(now);
      if (viewType === "monthly") {
        currentDate.setMonth(currentDate.getMonth() + i);
      } else {
        currentDate.setFullYear(currentDate.getFullYear() + i);
      }

      // Add contributions based on frequency
      const contributionsThisPeriod = Math.floor(
        (timeElapsed * contributionsPerYear) - contributionCount
      );
      if (contributionsThisPeriod > 0) {
        totalContributions += PMT * contributionsThisPeriod;
        contributionCount += contributionsThisPeriod;
      }

      // Calculate growth
      const principalGrowth = P * Math.pow(1 + r / n, n * timeElapsed);
      let contributionsGrowth = 0;

      for (let j = 0; j < contributionCount; j++) {
        const contributionTime = (j + 1) / contributionsPerYear;
        const timeRemaining = timeElapsed - contributionTime;
        if (timeRemaining > 0) {
          contributionsGrowth += PMT * Math.pow(1 + r / n, n * timeRemaining);
        }
      }

      const totalValue = principalGrowth + contributionsGrowth;
      const interestEarned = totalValue - totalContributions;

      dataPoints.push({
        time: currentDate.toISOString().split("T")[0],
        principal: Math.round(principalGrowth * 100) / 100,
        contributions: Math.round((totalContributions - P) * 100) / 100,
        interest: Math.round(interestEarned * 100) / 100,
        total: Math.round(totalValue * 100) / 100,
      });
    }

    return dataPoints;
  }
}


