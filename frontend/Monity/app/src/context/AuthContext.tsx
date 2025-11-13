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
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<{ email: string }>;
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
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
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
        setIsInitializing(false);
      }
    };
    bootstrap();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
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
    }
  }, []);

  const signup = useCallback(
    async (email: string, password: string, name?: string) => {
      try {
        const response = await apiService.register(email, password, name);
        if (response.success && response.data) {
          // Return email for confirmation page - don't try to login automatically
          // User needs to confirm email first
          return { email };
        } else {
          throw new Error(response.error || "Signup failed");
        }
      } catch (error) {
        throw error;
      }
    },
    []
  );

  const loginWithGoogle = useCallback(async () => {
    try {
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
    }
  }, [socialGoogleSignIn]);


  const logout = useCallback(async () => {
    try {
      await apiService.logout();
      setUser(null);
    } catch (error) {
      // Silent fail
    }
  }, []);

  const updateProfile = useCallback(async (profileData: Partial<User>) => {
    try {
      const response = await apiService.updateProfile(profileData);
      
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        // Check if it's an unauthorized error
        if (response.errorCode === "UNAUTHORIZED") {
          // Token expired, logout user
          setUser(null);
          await apiService.clearToken();
          throw new Error("Sua sessão expirou. Por favor, faça login novamente.");
        }
        const errorMsg = response.error || "Profile update failed";
        throw new Error(errorMsg);
      }
    } catch (error: any) {
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
      // Silent fail
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isInitializing,
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
      isInitializing,
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
