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
  isFavorite?: boolean;
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
      let rawResponse: string | null = null;
      
      // Get the response as text first so we can use it if JSON parsing fails
      const responseClone = response.clone();
      rawResponse = await responseClone.text();
      
      try {
        data = JSON.parse(rawResponse);
        console.log("📊 Response data:", data);
      } catch (jsonError) {
        console.error("❌ JSON Parse Error:", jsonError);
        console.error("❌ Raw response:", rawResponse?.substring(0, 500));
        
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
          console.warn("⚠️ Unauthorized (401): Token expired or invalid. Clearing token...");
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
          const rateLimitReset = response.headers.get('ratelimit-reset');
          const errorMsg = data.message || data.error || "Too many requests. Please try again later.";
          console.error(`⚠️ Rate limit exceeded! status: ${response.status}`);
          console.error("Rate limit info:", { retryAfter, rateLimitReset, message: errorMsg });
          return {
            success: false,
            data: null as T,
            error: errorMsg,
            errorCode: "RATE_LIMIT_EXCEEDED",
            errorDetails: retryAfter ? `Please try again after ${retryAfter} seconds (${Math.ceil(parseInt(retryAfter) / 60)} minutes)` : undefined,
          };
        }
        
        console.error(`❌ HTTP error! status: ${response.status}`);
        console.error("❌ Response data:", JSON.stringify(data, null, 2));
        console.error("❌ Response headers:", Object.fromEntries(response.headers.entries()));
        console.error("❌ Full error object:", {
          error: data.error,
          errorCode: data.errorCode,
          errorDetails: data.errorDetails,
          debug: data.debug,
          allKeys: Object.keys(data),
        });
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
        console.error("❌ API returned success: false", {
          error: data.error,
          message: data.message,
          errorCode: data.errorCode,
          errorDetails: data.errorDetails,
          fullData: data,
        });
        return {
          success: false,
          data: null as T,
          error: data.error || data.message || "Request failed",
          errorCode: data.errorCode,
          errorDetails: data.errorDetails,
        };
      }
      
      // Handle rate limiting specifically
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const rateLimitReset = response.headers.get('ratelimit-reset');
        const errorMsg = data.message || data.error || "Too many requests. Please try again later.";
        console.error("⚠️ Rate limit exceeded", {
          retryAfter,
          rateLimitReset,
          message: errorMsg,
        });
        return {
          success: false,
          data: null as T,
          error: errorMsg,
          errorCode: "RATE_LIMIT_EXCEEDED",
          errorDetails: retryAfter ? `Please try again after ${retryAfter} seconds` : undefined,
        };
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
    console.log("🔄 apiService.updateProfile called with:", profileData);
    const result = await this.request<User>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
    console.log("📊 apiService.updateProfile result:", {
      success: result.success,
      hasData: !!result.data,
      error: result.error,
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
