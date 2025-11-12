import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiService, User } from "../services/apiService";
import { SocialAuthProvider, useSocialAuth } from "./SocialAuthContext";

type AuthUser = User | null;

type AuthContextValue = {
  user: AuthUser;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
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

function AuthProviderInner({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { signInWithGoogle: socialGoogleSignIn } = useSocialAuth();

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
            // Profile fetch failed, check if it's an unauthorized error
            if (response.errorCode === "UNAUTHORIZED") {
              // Token expired, clear auth state
              setUser(null);
              await apiService.clearToken();
            } else {
              // Other error, clear auth state
              setUser(null);
              await apiService.clearToken();
            }
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
    setIsLoading(true);
    
    try {
      const response = await apiService.login(email, password);
      
      if (response.success && response.data) {
        // After successful login, fetch the user profile
        const profileResponse = await apiService.getProfile();
        
        if (profileResponse.success && profileResponse.data) {
          setUser(profileResponse.data);
          setIsLoading(false);
        } else {
          setIsLoading(false);
          throw new Error("Failed to fetch user profile: " + profileResponse.error);
        }
      } else {
        setIsLoading(false);
        throw new Error(response.error || "Login failed");
      }
    } catch (error) {
      setIsLoading(false);
      throw error;
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
      await socialGoogleSignIn();
      // After successful sign in, refresh user profile
      const profileResponse = await apiService.getProfile();
      if (profileResponse.success && profileResponse.data) {
        setUser(profileResponse.data);
      } else {
        throw new Error(profileResponse.error || "Falha ao buscar perfil");
      }
    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [socialGoogleSignIn]);


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
        // Check if it's an unauthorized error
        if (response.errorCode === "UNAUTHORIZED") {
          // Token expired, logout user
          setUser(null);
          await apiService.clearToken();
          throw new Error("Sua sessão expirou. Por favor, faça login novamente.");
        }
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
      } else if (response.errorCode === "UNAUTHORIZED") {
        // Token expired, logout user
        setUser(null);
        await apiService.clearToken();
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
      logout,
      updateProfile,
      changePassword,
      deleteAccount,
      refreshUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SocialAuthProvider>
      <AuthProviderInner>{children}</AuthProviderInner>
    </SocialAuthProvider>
  );
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
