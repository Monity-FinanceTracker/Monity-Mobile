import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

// Base API configuration
const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl || "http://localhost:3000/api/v1";

const AUTH_TOKEN_KEY = "auth_token";

// Types
export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  cpf?: string;
  createdAt: string;
  subscriptionTier?: string;
  subscriptionExpiresAt?: string;
  updatedAt?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  limitations?: string[];
  popular?: boolean;
}

export interface SubscriptionInfo {
  subscription_tier: string;
  subscription_expires_at?: string;
  is_premium: boolean;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  date: string;
  time?: string;
  type: "income" | "expense";
  categoryId?: string;
  category?: {
    id: string;
    name: string;
    color: string;
    icon: string;
  };
  paymentMethod?: string;
  description?: string;
  isRecurring?: boolean;
  isFavorite?: boolean;
  recurrenceDay?: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  typeId: number; // Backend uses typeId (1=expense, 2=income, 3=savings)
  type?: "income" | "expense" | "savings"; // Computed field for frontend compatibility
  totalSpent?: number;
  transactionCount?: number;
  percentage?: number;
}

export interface Balance {
  total: number;
  income: number;
  expenses: number;
  change: number;
  changePercentage: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  errorCode?: string;
  errorDetails?: string;
  debug?: any;
}

// API Service Class
class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.initializeToken();
  }

  private async initializeToken() {
    try {
      this.token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
      // Silent fail - token will be null
    }
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = this.token || (await AsyncStorage.getItem(AUTH_TOKEN_KEY));
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const headers = await this.getAuthHeaders();

      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      
      let data;
      let rawResponse: string | null = null;
      
      // Get the response as text first so we can use it if JSON parsing fails
      const responseClone = response.clone();
      rawResponse = await responseClone.text();
      
      try {
        data = JSON.parse(rawResponse);
      } catch (jsonError) {
        // If it's a 404, it's probably an HTML page from the server
        if (response.status === 404) {
          return {
            success: false,
            data: null as T,
            error: `Endpoint not found: ${endpoint}. The server may need to be restarted or the route may not be configured.`,
            errorCode: "NOT_FOUND",
          };
        }
        
        throw new Error(`JSON Parse error: ${jsonError instanceof Error ? jsonError.message : 'Unknown error'}. Response: ${rawResponse?.substring(0, 200)}`);
      }

      if (!response.ok) {
        // Handle unauthorized (token expired or invalid)
        if (response.status === 401) {
          // Clear token from memory and storage
          await this.clearToken();
          return {
            success: false,
            data: null as T,
            error: data.message || data.error || "Sua sessão expirou. Por favor, faça login novamente.",
            errorCode: "UNAUTHORIZED",
            errorDetails: "Token expired or invalid",
          };
        }

        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after');
          const errorMsg = data.message || data.error || "Too many requests. Please try again later.";
          return {
            success: false,
            data: null as T,
            error: errorMsg,
            errorCode: "RATE_LIMIT_EXCEEDED",
            errorDetails: retryAfter ? `Please try again after ${retryAfter} seconds (${Math.ceil(parseInt(retryAfter) / 60)} minutes)` : undefined,
          };
        }
        
        return {
          success: false,
          data: null as T,
          error: data.error || data.message || `HTTP error! status: ${response.status}`,
          errorCode: data.errorCode,
          errorDetails: data.errorDetails,
          debug: data.debug,
        };
      }

      // Check if response has success: false (some endpoints return this format)
      if (data.success === false) {
        // Don't log expected errors like invalid credentials
        // Only log unexpected errors (server errors, etc.)
        return {
          success: false,
          data: null as T,
          error: data.error || data.message || "Request failed",
          errorCode: data.errorCode,
          errorDetails: data.errorDetails,
        };
      }
      
      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        data: null as T,
        error:
          error instanceof Error ? error.message : "Network request failed",
      };
    }
  }

  // Auth methods
  async login(
    email: string,
    password: string
  ): Promise<ApiResponse<{ user: User; session: any }>> {
    const response = await this.request<{ user: User; session: any }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }
    );

    if (response.success && response.data) {
      const token = response.data.session?.access_token;
      
      if (token) {
        this.token = token;
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      }
    }

    return response;
  }

  async checkEmailExists(
    email: string
  ): Promise<ApiResponse<{ exists: boolean }>> {
    const response = await this.request<{ exists: boolean }>(
      "/auth/check-email",
      {
        method: "POST",
        body: JSON.stringify({ email }),
      }
    );

    return response;
  }

  async register(
    email: string,
    password: string,
    name?: string
  ): Promise<ApiResponse<{ user: User; session: any }>> {
    const response = await this.request<{ user: User; session: any }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify({ email, password, name }),
      }
    );

    if (response.success && response.data) {
      const token = response.data.session?.access_token;
      // Only save token if session exists (email is confirmed)
      // If email confirmation is required, session will be null
      if (token) {
        this.token = token;
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      } else {
        // Clear any existing token if no session (email not confirmed)
        this.token = null;
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      }
    }

    return response;
  }

  async logout(): Promise<ApiResponse<void>> {
    try {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      this.token = null;
      return { success: true, data: undefined as any };
    } catch (error) {
      return {
        success: false,
        data: undefined as any,
        error: "Failed to logout",
      };
    }
  }

  async getProfile(): Promise<ApiResponse<User>> {
    const response = await this.request<User>("/auth/profile");
    return response;
  }

  async updateProfile(profileData: Partial<User>): Promise<ApiResponse<User>> {
    const result = await this.request<User>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
    return result;
  }

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse<void>> {
    return this.request<void>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async deleteAccount(password: string): Promise<ApiResponse<void>> {
    return this.request<void>("/auth/delete-account", {
      method: "DELETE",
      body: JSON.stringify({ password }),
    });
  }

  // Transaction methods
  async getTransactions(filters?: {
    type?: "income" | "expense";
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<ApiResponse<Transaction[]>> {
    const queryParams = new URLSearchParams();
    if (filters?.type) queryParams.append("type", filters.type);
    if (filters?.categoryId)
      queryParams.append("categoryId", filters.categoryId);
    if (filters?.startDate) queryParams.append("startDate", filters.startDate);
    if (filters?.endDate) queryParams.append("endDate", filters.endDate);
    if (filters?.search) queryParams.append("search", filters.search);

    const endpoint = `/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    return this.request<Transaction[]>(endpoint);
  }

  async getRecentTransactions(
    limit: number = 5
  ): Promise<ApiResponse<Transaction[]>> {
    return this.request<Transaction[]>(`/transactions/recent?limit=${limit}`);
  }

  async getTransactionById(id: string): Promise<ApiResponse<Transaction>> {
    return this.request<Transaction>(`/transactions/${id}`);
  }

  async createTransaction(
    transaction: Omit<Transaction, "id">
  ): Promise<ApiResponse<Transaction>> {
    return this.request<Transaction>("/transactions", {
      method: "POST",
      body: JSON.stringify(transaction),
    });
  }

  async updateTransaction(
    id: string,
    transaction: Partial<Transaction>
  ): Promise<ApiResponse<Transaction>> {
    return this.request<Transaction>(`/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify(transaction),
    });
  }

  async deleteTransaction(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/transactions/${id}`, {
      method: "DELETE",
    });
  }

  // Legacy methods for frontend compatibility
  async addExpense(expenseData: {
    description: string;
    amount: number;
    category: string;
    date: string;
    paymentMethod?: string;
    isRecurring?: boolean;
    isFavorite?: boolean;
  }): Promise<ApiResponse<Transaction>> {
    return this.request<Transaction>("/transactions/add-expense", {
      method: "POST",
      body: JSON.stringify(expenseData),
    });
  }

  async addIncome(incomeData: {
    description: string;
    amount: number;
    category: string;
    date: string;
    paymentMethod?: string;
    isRecurring?: boolean;
    isFavorite?: boolean;
  }): Promise<ApiResponse<Transaction>> {
    return this.request<Transaction>("/transactions/add-income", {
      method: "POST",
      body: JSON.stringify(incomeData),
    });
  }

  // Category methods
  async getCategories(): Promise<ApiResponse<Category[]>> {
    return this.request<Category[]>("/categories");
  }

  async createCategory(
    category: Omit<Category, "id">
  ): Promise<ApiResponse<Category>> {
    return this.request<Category>("/categories", {
      method: "POST",
      body: JSON.stringify(category),
    });
  }

  async updateCategory(
    id: string,
    category: Partial<Category>
  ): Promise<ApiResponse<Category>> {
    return this.request<Category>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(category),
    });
  }

  async deleteCategory(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/categories/${id}`, {
      method: "DELETE",
    });
  }

  // Balance methods
  async getBalance(): Promise<ApiResponse<Balance>> {
    return this.request<Balance>("/balance/all");
  }

  async getMonthlyBalance(
    month: number,
    year: number
  ): Promise<ApiResponse<Balance>> {
    return this.request<Balance>(`/balance/${month}/${year}`);
  }

  async getBalanceHistory(): Promise<ApiResponse<Balance[]>> {
    return this.request<Balance[]>("/balance/history");
  }

  async getSavingsOverview(): Promise<ApiResponse<any>> {
    return this.request<any>("/balance/savings-overview");
  }

  // Savings Goals methods
  async getSavingsGoals(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/savings-goals");
  }

  async getSavingsGoalById(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/savings-goals/${id}`);
  }

  async createSavingsGoal(goal: {
    goal_name: string;
    target_amount: number;
    target_date: string;
    current_amount?: number;
  }): Promise<ApiResponse<any>> {
    return this.request<any>("/savings-goals", {
      method: "POST",
      body: JSON.stringify(goal),
    });
  }

  async updateSavingsGoal(
    id: string,
    goal: {
      goal_name?: string;
      target_amount?: number;
      target_date?: string;
      current_amount?: number;
    }
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/savings-goals/${id}`, {
      method: "PUT",
      body: JSON.stringify(goal),
    });
  }

  async deleteSavingsGoal(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/savings-goals/${id}`, {
      method: "DELETE",
    });
  }

  async allocateToSavingsGoal(
    id: string,
    amount: number
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/savings-goals/${id}/allocate`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
  }

  async withdrawFromSavingsGoal(
    id: string,
    amount: number
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/savings-goals/${id}/withdraw`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
  }

  // AI methods
  async suggestCategory(
    description: string
  ): Promise<ApiResponse<{ categoryId: string; confidence: number }>> {
    return this.request<{ categoryId: string; confidence: number }>(
      "/ai/suggest-category",
      {
        method: "POST",
        body: JSON.stringify({ description }),
      }
    );
  }

  async getFinancialProjections(): Promise<ApiResponse<any>> {
    return this.request<any>("/ai/projections");
  }

  async getFinancialHealth(): Promise<ApiResponse<any>> {
    return this.request<any>("/auth/financial-health");
  }

  async getAIStats(): Promise<ApiResponse<any>> {
    return this.request<any>("/ai/stats");
  }

  // Subscription methods
  async getSubscriptionInfo(): Promise<ApiResponse<SubscriptionInfo>> {
    return this.request<SubscriptionInfo>("/subscription-tier");
  }

  async getSubscriptionPlans(): Promise<ApiResponse<SubscriptionPlan[]>> {
    return this.request<SubscriptionPlan[]>("/subscription-tier/plans");
  }

  async createSubscription(planId: string, paymentMethodId?: string): Promise<ApiResponse<any>> {
    return this.request<any>("/subscription-tier/create", {
      method: "POST",
      body: JSON.stringify({ planId, paymentMethodId }),
    });
  }

  async cancelSubscription(): Promise<ApiResponse<any>> {
    return this.request<any>("/subscription-tier/cancel", {
      method: "POST",
    });
  }

  async validateInAppPurchase(purchaseData: {
    platform: string;
    productId: string;
    transactionId?: string;
    transactionReceipt?: string;
    purchaseToken?: string;
    originalTransactionIdentifierIOS?: string;
  }): Promise<ApiResponse<any>> {
    return this.request<any>("/subscription-tier/validate-purchase", {
      method: "POST",
      body: JSON.stringify(purchaseData),
    });
  }

  // Utility methods
  async isAuthenticated(): Promise<boolean> {
    const token = this.token || (await AsyncStorage.getItem(AUTH_TOKEN_KEY));
    return !!token;
  }

  async clearToken(): Promise<void> {
    this.token = null;
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  }

  async getToken(): Promise<string | null> {
    return this.token || (await AsyncStorage.getItem(AUTH_TOKEN_KEY));
  }

  // Recurring Transaction methods
  async getRecurringTransactions(): Promise<ApiResponse<Transaction[]>> {
    return this.request<Transaction[]>("/recurring-transactions");
  }

  async getRecurringTransactionById(id: string): Promise<ApiResponse<Transaction>> {
    return this.request<Transaction>(`/recurring-transactions/${id}`);
  }

  async createRecurringTransaction(recurringTransaction: {
    description: string;
    amount: number;
    category: string;
    categoryId?: string;
    typeId: number;
    recurrenceDay: number;
    isFavorite?: boolean;
  }): Promise<ApiResponse<Transaction>> {
    return this.request<Transaction>("/recurring-transactions", {
      method: "POST",
      body: JSON.stringify(recurringTransaction),
    });
  }

  async updateRecurringTransaction(
    id: string,
    recurringTransaction: Partial<Transaction> & { recurrenceDay?: number }
  ): Promise<ApiResponse<Transaction>> {
    return this.request<Transaction>(`/recurring-transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify(recurringTransaction),
    });
  }

  async deleteRecurringTransaction(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/recurring-transactions/${id}`, {
      method: "DELETE",
    });
  }
}

// Export singleton instance
export const apiService = new ApiService(API_BASE_URL);

// Default export for compatibility
export default apiService;
