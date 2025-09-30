// This file exports all services
import SmartCategorizationService from "./smartCategorizationService";
import AISchedulerService from "./aiSchedulerService";
import { expenseSplittingService } from "./expenseSplittingService";
import { savingsGoalsService } from "./savingsGoalsService";
import FinancialHealthService from "./financialHealthService";
import CacheService from "./cacheService";
import DataExportService from "./dataExportService";
import FinancialProjectionsService from "./financialProjectionsService";
import NotificationService from "./notificationService";

// Create singleton instances
const smartCategorizationService = new SmartCategorizationService(null);
const aiSchedulerService = new AISchedulerService();

export {
  smartCategorizationService,
  aiSchedulerService,
  expenseSplittingService,
  savingsGoalsService,
  FinancialHealthService,
  CacheService,
  DataExportService,
  FinancialProjectionsService,
  NotificationService,
};
