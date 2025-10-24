import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

// Base API configuration
const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl || "http://localhost:3000/api/v1";

console.log("🌐 API_BASE_URL:", API_BASE_URL);
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
      console.error("Error loading auth token:", error);
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

      console.log(`🌐 Making API request to: ${url}`);
      console.log("📋 Request headers:", headers);
      console.log("📋 Request options:", options);

      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      console.log(`📊 Response status: ${response.status}`);
      console.log(`📊 Response ok: ${response.ok}`);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      console.log("📊 Content-Type:", contentType);
      
      let data;
      try {
        data = await response.json();
        console.log("📊 Response data:", data);
      } catch (jsonError) {
        console.error("❌ JSON Parse Error:", jsonError);
        // Try to get text response for debugging
        const textResponse = await response.text();
        console.error("❌ Raw response:", textResponse.substring(0, 500));
        throw new Error(`JSON Parse error: ${jsonError instanceof Error ? jsonError.message : 'Unknown error'}. Response: ${textResponse.substring(0, 200)}`);
      }

      if (!response.ok) {
        console.error(`❌ HTTP error! status: ${response.status}`);
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`
        );
      }

      console.log("✅ Request successful");
      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      console.error("❌ API request failed:", error);
      console.error("❌ Error details:", {
        endpoint,
        baseURL: this.baseURL,
        fullURL: `${this.baseURL}${endpoint}`,
        error: error instanceof Error ? error.message : "Unknown error",
      });
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
    console.log("🔐 ApiService.login called with:", { email, password: "***" });
    
    const response = await this.request<{ user: User; session: any }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }
    );

    console.log("📡 ApiService.login response:", response);

    if (response.success && response.data) {
      const token = response.data.session?.access_token;
      console.log("🔑 Token extracted:", token ? "Present" : "Missing");
      
      if (token) {
        this.token = token;
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
        console.log("💾 Token saved to AsyncStorage");
      } else {
        console.error("❌ No access_token in session");
      }
    } else {
      console.error("❌ Login request failed:", response.error);
    }

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
      if (token) {
        this.token = token;
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
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
    console.log("👤 ApiService.getProfile called");
    const token = await this.getToken();
    console.log("🔑 Current token:", token ? "Present" : "Missing");
    
    const response = await this.request<User>("/auth/profile");
    console.log("📡 ApiService.getProfile response:", response);
    
    return response;
  }

  async updateProfile(profileData: Partial<User>): Promise<ApiResponse<User>> {
    return this.request<User>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
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
}

// Export singleton instance
export const apiService = new ApiService(API_BASE_URL);

// Default export for compatibility
export default apiService;
