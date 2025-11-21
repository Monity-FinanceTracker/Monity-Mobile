import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from 'expo-linking';
import { apiService, User } from "../services/apiService";
import { SocialAuthProvider, useSocialAuth } from "./SocialAuthContext";
import { supabase } from "../config/supabase";

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
  resendConfirmationEmail: (email: string) => Promise<void>;
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

  // Set up Supabase auth state listener for automatic token refresh
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event, 'Session:', !!session);

        if (session?.access_token) {
          // Session is active or refreshed, update token in apiService
          const currentToken = await AsyncStorage.getItem('auth_token');

          // Only update if token actually changed to avoid unnecessary writes
          if (currentToken !== session.access_token) {
            console.log('✅ Token refreshed, updating storage');
            await AsyncStorage.setItem('auth_token', session.access_token);
            apiService.token = session.access_token;
          }
        }

        // Handle specific events
        if (event === 'SIGNED_OUT') {
          console.log('🔒 User signed out');
          setUser(null);
          await apiService.clearToken();
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed successfully');
        } else if (event === 'USER_UPDATED') {
          console.log('👤 User updated, refreshing profile');
          // Optionally refresh user profile
          const response = await apiService.getProfile();
          if (response.success && response.data) {
            setUser(response.data);
          }
        }
      }
    );

    // Cleanup listener on unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Set up deep link listener for email confirmation and password reset
  useEffect(() => {
    // Handle initial URL if app was opened from link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = async (url: string) => {
    console.log('📎 Deep link received:', url);

    const parsed = Linking.parse(url);
    console.log('📎 Parsed deep link:', parsed);

    // Handle email confirmation: monity://auth/confirm?access_token=...&type=signup
    if (parsed.path === 'auth/confirm' || parsed.hostname === 'confirm') {
      const { access_token, refresh_token, type } = parsed.queryParams || {};

      if (access_token && type === 'signup') {
        console.log('✅ Email confirmation link detected');

        try {
          // Set the session with the tokens from the confirmation email
          const { data, error } = await supabase.auth.setSession({
            access_token: access_token as string,
            refresh_token: refresh_token as string || '',
          });

          if (error) {
            console.error('❌ Email confirmation failed:', error);
            throw error;
          }

          if (data.session) {
            console.log('✅ Email confirmed, session created');
            // Save token and fetch profile
            await AsyncStorage.setItem('auth_token', data.session.access_token);
            apiService.token = data.session.access_token;

            const profileResponse = await apiService.getProfile();
            if (profileResponse.success && profileResponse.data) {
              setUser(profileResponse.data);
            }
          }
        } catch (error) {
          console.error('❌ Failed to process email confirmation:', error);
        }
      }
    }

    // Handle password reset: monity://auth/reset-password?access_token=...&type=recovery
    if (parsed.path === 'auth/reset-password' || parsed.hostname === 'reset-password') {
      const { access_token, refresh_token, type } = parsed.queryParams || {};

      if (access_token && type === 'recovery') {
        console.log('✅ Password reset link detected');

        try {
          // Set the session with the tokens from the password reset email
          const { data, error } = await supabase.auth.setSession({
            access_token: access_token as string,
            refresh_token: refresh_token as string || '',
          });

          if (error) {
            console.error('❌ Password reset session failed:', error);
            throw error;
          }

          console.log('✅ Password reset session created, user can now update password');
          // The user will be navigated to ResetPassword screen automatically
          // by the navigation system since they now have a session
        } catch (error) {
          console.error('❌ Failed to process password reset:', error);
        }
      }
    }
  };

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
        Alert.alert(
          'Sessão Expirada',
          'Sua sessão expirou. Por favor, faça login novamente.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      // Silent fail
    }
  }, []);

  const resendConfirmationEmail = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: 'monity://auth/confirm',
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to resend confirmation email');
      }

      console.log('✅ Confirmation email resent successfully');
    } catch (error: any) {
      console.error('❌ Failed to resend confirmation email:', error);
      throw error;
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
      resendConfirmationEmail,
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
      resendConfirmationEmail,
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
