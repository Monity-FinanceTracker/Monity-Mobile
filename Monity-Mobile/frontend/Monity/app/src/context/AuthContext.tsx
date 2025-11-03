import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiService, User } from "../services/apiService";
import {
  signInWithGoogle,
  signInWithApple,
} from "../services/socialAuthService";

type AuthUser = User | null;

type AuthContextValue = {
  user: AuthUser;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const isAuthenticated = await apiService.isAuthenticated();
        
        if (isAuthenticated) {
          // Token is valid, get user profile
          const response = await apiService.getProfile();
          
          if (response.success && response.data) {
            setUser(response.data);
          } else {
            // Profile fetch failed, clear auth state
            setUser(null);
            await apiService.clearToken();
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
        // Clear any invalid token
        await apiService.clearToken();
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const response = await apiService.login(email, password);
      
      if (response.success && response.data) {
        // After successful login, fetch the user profile
        const profileResponse = await apiService.getProfile();
        
        if (profileResponse.success && profileResponse.data) {
          setUser(profileResponse.data);
        } else {
          throw new Error("Failed to fetch user profile: " + profileResponse.error);
        }
      } else {
        throw new Error(response.error || "Login failed");
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(
    async (email: string, password: string, name?: string) => {
      try {
        setIsLoading(true);
        const response = await apiService.register(email, password, name);
        if (response.success && response.data) {
          // After successful registration, fetch the user profile
          const profileResponse = await apiService.getProfile();
          if (profileResponse.success && profileResponse.data) {
            setUser(profileResponse.data);
          } else {
            throw new Error("Failed to fetch user profile");
          }
        } else {
          throw new Error(response.error || "Signup failed");
        }
      } catch (error) {
        console.error("Signup error:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const loginWithGoogle = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await signInWithGoogle();
      
      if (result.success && result.session) {
        // Token já foi salvo pelo socialAuthService
        // Agora buscar o perfil do usuário
        const profileResponse = await apiService.getProfile();
        
        if (profileResponse.success && profileResponse.data) {
          setUser(profileResponse.data);
        } else {
          throw new Error("Failed to fetch user profile: " + profileResponse.error);
        }
      } else {
        throw new Error(result.error || "Google login failed");
      }
    } catch (error: any) {
      console.error("Google login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithApple = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await signInWithApple();
      
      if (result.success && result.session) {
        // Token já foi salvo pelo socialAuthService
        // Agora buscar o perfil do usuário
        const profileResponse = await apiService.getProfile();
        
        if (profileResponse.success && profileResponse.data) {
          setUser(profileResponse.data);
        } else {
          throw new Error("Failed to fetch user profile: " + profileResponse.error);
        }
      } else {
        throw new Error(result.error || "Apple login failed");
      }
    } catch (error: any) {
      console.error("Apple login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiService.logout();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, []);

  const updateProfile = useCallback(async (profileData: Partial<User>) => {
    console.log("🔐 AuthContext.updateProfile called with:", profileData);
    try {
      console.log("📡 Calling apiService.updateProfile...");
      const response = await apiService.updateProfile(profileData);
      console.log("📡 AuthContext received response:", {
        success: response.success,
        hasData: !!response.data,
        error: response.error,
        responseKeys: response.data ? Object.keys(response.data) : [],
      });
      
      if (response.success && response.data) {
        console.log("✅ Profile update successful, updating user state");
        setUser(response.data);
        console.log("✅ User state updated");
      } else {
        const errorMsg = response.error || "Profile update failed";
        console.error("❌ Profile update failed:", errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error("❌ Profile update error in AuthContext:", {
        message: error?.message,
        error: error,
        stack: error?.stack,
      });
      throw error;
    }
  }, []);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      try {
        const response = await apiService.changePassword(
          currentPassword,
          newPassword
        );
        if (!response.success) {
          throw new Error(response.error || "Password change failed");
        }
      } catch (error) {
        console.error("Password change error:", error);
        throw error;
      }
    },
    []
  );

  const deleteAccount = useCallback(async (password: string) => {
    try {
      const response = await apiService.deleteAccount(password);
      if (response.success) {
        setUser(null);
        await apiService.clearToken();
      } else {
        throw new Error(response.error || "Account deletion failed");
      }
    } catch (error) {
      console.error("Account deletion error:", error);
      throw error;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await apiService.getProfile();
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (error) {
      console.error("Refresh user error:", error);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      signup,
      loginWithGoogle,
      loginWithApple,
      logout,
      updateProfile,
      changePassword,
      deleteAccount,
      refreshUser,
    }),
    [
      user,
      isLoading,
      login,
      signup,
      loginWithGoogle,
      loginWithApple,
      logout,
      updateProfile,
      changePassword,
      deleteAccount,
      refreshUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// Default export to prevent Expo Router from treating this as a route
export default function AuthContextProvider() {
  return null;
}
