import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiService, User } from "../services/apiService";

type AuthUser = User | null;

type AuthContextValue = {
  user: AuthUser;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
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
        console.error("Auth bootstrap error:", error);
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
          throw new Error("Failed to fetch user profile");
        }
      } else {
        throw new Error(response.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
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

  const logout = useCallback(async () => {
    try {
      await apiService.logout();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, []);

  const updateProfile = useCallback(async (profileData: Partial<User>) => {
    try {
      const response = await apiService.updateProfile(profileData);
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        throw new Error(response.error || "Profile update failed");
      }
    } catch (error) {
      console.error("Profile update error:", error);
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

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      signup,
      logout,
      updateProfile,
      changePassword,
      deleteAccount,
    }),
    [
      user,
      isLoading,
      login,
      signup,
      logout,
      updateProfile,
      changePassword,
      deleteAccount,
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
