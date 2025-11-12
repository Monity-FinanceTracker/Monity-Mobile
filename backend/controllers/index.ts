import AuthController from "./authController";
import TransactionController from "./transactionController";
import CategoryController from "./categoryController";
import GroupController from "./groupController";
import SavingsGoalController from "./savingsGoalController";
import BalanceController from "./balanceController";
import SubscriptionController from "./subscriptionController";
import AdminController from "./adminController";
import AiController from "./aiController";
import InvitationController from "./invitationController";
import FinancialProjectionsController from "./financialProjectionsController";
import UserController from "./userController";
import RecurringTransactionController from "./recurringTransactionController";

const initializeControllers = (supabase: any) => {
  return {
    authController: new AuthController(supabase),
    transactionController: new TransactionController(supabase),
    categoryController: new CategoryController(),
    groupController: new GroupController(supabase),
    savingsGoalController: new SavingsGoalController(supabase),
    balanceController: new BalanceController(supabase),
    subscriptionController: new SubscriptionController(supabase),
    adminController: new AdminController(supabase),
    aiController: new AiController(supabase),
    invitationController: new InvitationController(supabase),
    financialProjectionsController: new FinancialProjectionsController(
      supabase
    ),
    userController: new UserController(supabase),
    recurringTransactionController: new RecurringTransactionController(),
  };
};

export { initializeControllers };
