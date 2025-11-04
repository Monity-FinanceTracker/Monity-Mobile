import React, { createContext, useContext, useCallback, useState, useMemo } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';

// Complete the auth session properly
WebBrowser.maybeCompleteAuthSession();

// Configuration
const SUPABASE_URL =
  Constants.expoConfig?.extra?.supabaseUrl ||
  'https://eeubnmpetzhjcludrjwz.supabase.co';
const SUPABASE_ANON_KEY =
  Constants.expoConfig?.extra?.supabaseAnonKey ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVldWJubXBldHpoamNsdWRyand6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MTI4MzQsImV4cCI6MjA2ODA4ODgzNH0.QZc4eJ4tLW10WIwhsu_p7TvldzodQrwJRnJ8LlzXkdM';

const GOOGLE_OAUTH = Constants.expoConfig?.extra?.googleOAuth || {};
const GOOGLE_WEB_CLIENT_ID = GOOGLE_OAUTH.webClientId;
const REDIRECT_SCHEME = 'monity://auth/callback';
const AUTH_TOKEN_KEY = 'auth_token';

interface SocialAuthContextValue {
  isAuthenticating: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  clearError: () => void;
}

const SocialAuthContext = createContext<SocialAuthContextValue | undefined>(undefined);

export function SocialAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create Supabase client
  const getSupabaseClient = useCallback(() => {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }, []);

  // Extract code/token from callback URL
  const extractAuthParams = useCallback((url: string) => {
    try {
      const parsedUrl = new URL(url);
      return {
        code: parsedUrl.searchParams.get('code'),
        accessToken: parsedUrl.searchParams.get('access_token'),
        error: parsedUrl.searchParams.get('error'),
      };
    } catch {
      // Handle custom scheme URLs
      const queryMatch = url.match(/[?#](.+)/);
      if (queryMatch) {
        const params = new URLSearchParams(queryMatch[1]);
        return {
          code: params.get('code'),
          accessToken: params.get('access_token'),
          error: params.get('error'),
        };
      }
      return { code: null, accessToken: null, error: null };
    }
  }, []);

  // Exchange code for session
  const exchangeCodeForSession = useCallback(async (code: string) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      // If code expired, try to get existing session
      if (error.message?.includes('expired') || error.message?.includes('already been used')) {
        const { data: existingSession } = await supabase.auth.getSession();
        if (existingSession?.session) {
          return {
            session: existingSession.session,
            user: existingSession.session.user,
          };
        }
      }
      throw error;
    }

    if (!data.session) {
      throw new Error('Sessão não criada');
    }

    return {
      session: data.session,
      user: data.user || data.session.user,
    };
  }, [getSupabaseClient]);

  // Save session token
  const saveSession = useCallback(async (session: any) => {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, session.access_token);
  }, []);

  // Google Sign In
  const signInWithGoogle = useCallback(async () => {
    setIsAuthenticating(true);
    setError(null);

    try {
      console.log('🔐 Iniciando login com Google...');
      
      // Log Client ID status (without blocking if it's a placeholder)
      if (!GOOGLE_WEB_CLIENT_ID || GOOGLE_WEB_CLIENT_ID.includes('YOUR_')) {
        console.log('⚠️ Client ID não configurado no app.json, usando configuração do Supabase');
      } else {
        console.log('🆔 Web Client ID configurado:', GOOGLE_WEB_CLIENT_ID.substring(0, 30) + '...');
      }

      const supabase = getSupabaseClient();

      // Step 1: Get OAuth URL from Supabase
      // Note: Supabase should use the credentials configured in its dashboard
      // Only pass client_id if you need to override (which is usually not needed)
      const oAuthOptions: any = {
        redirectTo: REDIRECT_SCHEME,
        skipBrowserRedirect: true,
      };

      // Only add client_id if it's configured and not a placeholder
      // This allows overriding Supabase's default configuration if needed
      if (GOOGLE_WEB_CLIENT_ID && !GOOGLE_WEB_CLIENT_ID.includes('YOUR_')) {
        oAuthOptions.queryParams = {
          client_id: GOOGLE_WEB_CLIENT_ID,
        };
        console.log('📝 Usando Client ID customizado do app.json');
      } else {
        console.log('📝 Usando configuração padrão do Supabase');
      }

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: oAuthOptions,
      });

      if (oauthError || !data.url) {
        console.error('❌ Erro ao obter URL OAuth:', oauthError);
        throw new Error(oauthError?.message || 'URL de autenticação não disponível');
      }

      console.log('✅ URL OAuth obtida com sucesso');

      // Step 2: Open browser for authentication
      const authResult = await WebBrowser.openAuthSessionAsync(data.url, REDIRECT_SCHEME);

      if (authResult.type !== 'success') {
        if (authResult.type === 'cancel') {
          throw new Error('Autenticação cancelada pelo usuário');
        }
        throw new Error('Autenticação falhou');
      }

      // Step 3: Extract auth params from callback URL
      const { code, accessToken, error: urlError } = extractAuthParams(authResult.url);

      if (urlError) {
        throw new Error(`Erro de autenticação: ${urlError}`);
      }

      // Step 4: Handle session
      if (accessToken) {
        // If we have access token, get session directly
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !sessionData.session) {
          throw new Error('Não foi possível obter a sessão');
        }

        await saveSession(sessionData.session);
        return;
      }

      if (code) {
        // Exchange code for session
        const { session } = await exchangeCodeForSession(code);
        await saveSession(session);
        return;
      }

      // If no code or token, try to get existing session
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        await saveSession(sessionData.session);
        return;
      }

      throw new Error('Código de autenticação não encontrado');
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao fazer login com Google';
      setError(errorMessage);
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  }, [getSupabaseClient, extractAuthParams, exchangeCodeForSession, saveSession]);

  // Apple Sign In
  const signInWithApple = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign In está disponível apenas no iOS');
    }

    setIsAuthenticating(true);
    setError(null);

    try {
      // Check availability
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Apple Sign In não está disponível neste dispositivo');
      }

      // Request credentials
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('Token de identidade não recebido da Apple');
      }

      // Sign in with Supabase
      const supabase = getSupabaseClient();
      const { data, error: signInError } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (signInError) {
        throw signInError;
      }

      if (!data.session) {
        throw new Error('Sessão não criada');
      }

      await saveSession(data.session);
    } catch (err: any) {
      // Handle cancellation
      if (
        err.code === 'ERR_REQUEST_CANCELED' ||
        err.code === 'ERR_CANCELED' ||
        err.code === '1001'
      ) {
        const errorMessage = 'Login cancelado pelo usuário';
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      const errorMessage = err.message || 'Erro ao fazer login com Apple';
      setError(errorMessage);
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  }, [getSupabaseClient, saveSession]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticating,
      error,
      signInWithGoogle,
      signInWithApple,
      clearError,
    }),
    [isAuthenticating, error, signInWithGoogle, signInWithApple, clearError]
  );

  return <SocialAuthContext.Provider value={value}>{children}</SocialAuthContext.Provider>;
}

export function useSocialAuth() {
  const context = useContext(SocialAuthContext);
  if (context === undefined) {
    throw new Error('useSocialAuth must be used within a SocialAuthProvider');
  }
  return context;
}

