import React, { createContext, useContext, useCallback, useState, useMemo } from 'react';
import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';

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
    console.log('🔍 extractAuthParams - URL recebida:', url);
    
    try {
      const parsedUrl = new URL(url);
      console.log('🔍 URL parseada com sucesso:', {
        protocol: parsedUrl.protocol,
        host: parsedUrl.host,
        pathname: parsedUrl.pathname,
        search: parsedUrl.search,
        hash: parsedUrl.hash,
      });
      
      const code = parsedUrl.searchParams.get('code') || parsedUrl.searchParams.get('?code');
      const accessToken = parsedUrl.searchParams.get('access_token') || parsedUrl.searchParams.get('?access_token');
      const refreshToken = parsedUrl.searchParams.get('refresh_token') || parsedUrl.searchParams.get('?refresh_token');
      const error = parsedUrl.searchParams.get('error') || parsedUrl.searchParams.get('?error');
      
      // Also check hash fragment (some OAuth flows use hash)
      if (!code && !accessToken && parsedUrl.hash) {
        console.log('🔍 Verificando hash fragment:', parsedUrl.hash);
        const hashParams = new URLSearchParams(parsedUrl.hash.substring(1));
        return {
          code: hashParams.get('code'),
          accessToken: hashParams.get('access_token'),
          refreshToken: hashParams.get('refresh_token'),
          error: hashParams.get('error'),
        };
      }
      
      return { code, accessToken, refreshToken, error };
    } catch (e) {
      console.log('⚠️ Erro ao parsear URL como URL padrão, tentando custom scheme:', e);
      // Handle custom scheme URLs (monity://auth/callback?code=...)
      // Try multiple patterns
      const patterns = [
        /[?#]code=([^&]+)/,
        /[?#]access_token=([^&]+)/,
        /[?#]error=([^&]+)/,
      ];
      
      let code: string | null = null;
      let accessToken: string | null = null;
      let refreshToken: string | null = null;
      let error: string | null = null;
      
      // Try to extract from query string
      const queryMatch = url.match(/[?#](.+)/);
      if (queryMatch) {
        console.log('🔍 Query string encontrada:', queryMatch[1]);
        const params = new URLSearchParams(queryMatch[1]);
        code = params.get('code');
        accessToken = params.get('access_token');
        refreshToken = params.get('refresh_token');
        error = params.get('error');
      }
      
      // If still not found, try regex patterns
      if (!code) {
        const codeMatch = url.match(/[?#]code=([^&]+)/);
        if (codeMatch) code = decodeURIComponent(codeMatch[1]);
      }
      
      if (!accessToken) {
        const tokenMatch = url.match(/[?#]access_token=([^&]+)/);
        if (tokenMatch) accessToken = decodeURIComponent(tokenMatch[1]);
      }
      
      if (!refreshToken) {
        const refreshMatch = url.match(/[?#]refresh_token=([^&]+)/);
        if (refreshMatch) refreshToken = decodeURIComponent(refreshMatch[1]);
      }
      
      if (!error) {
        const errorMatch = url.match(/[?#]error=([^&]+)/);
        if (errorMatch) error = decodeURIComponent(errorMatch[1]);
      }
      
      console.log('🔍 Parâmetros extraídos (custom scheme):', {
        code: code ? code.substring(0, 20) + '...' : null,
        accessToken: accessToken ? accessToken.substring(0, 20) + '...' : null,
        refreshToken: refreshToken ? refreshToken.substring(0, 20) + '...' : null,
        error,
      });
      
      return { code, accessToken, refreshToken, error };
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
        throw new Error(oauthError?.message || 'URL de autenticação não disponível');
      }

      console.log('✅ URL OAuth obtida com sucesso');

      // Step 2: Open browser for authentication
      const authResult = await WebBrowser.openAuthSessionAsync(data.url, REDIRECT_SCHEME);

      console.log('📱 Auth result type:', authResult.type);
      console.log('📱 Auth result URL:', authResult.url);
      console.log('📱 Auth result full:', JSON.stringify(authResult, null, 2));

      if (authResult.type !== 'success') {
        if (authResult.type === 'cancel') {
          throw new Error('Autenticação cancelada pelo usuário');
        }
        throw new Error('Autenticação falhou');
      }

      // Step 3: Extract auth params from callback URL
      console.log('🔍 Extraindo parâmetros da URL:', authResult.url);
      const { code, accessToken, refreshToken, error: urlError } = extractAuthParams(authResult.url);
      
      console.log('🔍 Parâmetros extraídos:', {
        hasCode: !!code,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        hasError: !!urlError,
        code: code ? code.substring(0, 20) + '...' : null,
        accessToken: accessToken ? accessToken.substring(0, 20) + '...' : null,
        refreshToken: refreshToken ? refreshToken.substring(0, 20) + '...' : null,
        error: urlError,
      });

      if (urlError) {
        throw new Error(`Erro de autenticação: ${urlError}`);
      }

      // Step 4: Handle session
      if (accessToken) {
        // If we have access token, create session manually using setSession
        console.log('✅ Access token encontrado, criando sessão...');
        
        // Create session object from tokens
        const session = {
          access_token: accessToken,
          refresh_token: refreshToken || '',
          expires_in: 3600, // Default expiration
          expires_at: Math.floor(Date.now() / 1000) + 3600, // Current time + 1 hour
          token_type: 'bearer',
          user: null as any, // Will be fetched after setting session
        };

        // Set the session in Supabase
        const { data: sessionData, error: setSessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });

        if (setSessionError) {
          throw new Error(`Erro ao criar sessão: ${setSessionError.message}`);
        }

        // Get the full session data (including user info)
        const { data: fullSessionData, error: getSessionError } = await supabase.auth.getSession();
        
        if (getSessionError || !fullSessionData.session) {
          throw new Error('Não foi possível obter a sessão completa');
        }

        console.log('✅ Sessão criada com sucesso!');
        await saveSession(fullSessionData.session);
        return;
      }

      if (code) {
        // Exchange code for session
        const { session } = await exchangeCodeForSession(code);
        await saveSession(session);
        return;
      }

      // If no code or token, try to get existing session
      console.log('⚠️ Nenhum código ou token encontrado, tentando obter sessão existente...');
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      console.log('🔍 Verificação de sessão:', {
        hasSession: !!sessionData?.session,
        hasError: !!sessionError,
        error: sessionError?.message,
      });
      
      if (sessionData?.session) {
        console.log('✅ Sessão existente encontrada!');
        await saveSession(sessionData.session);
        return;
      }

      throw new Error('Código de autenticação não encontrado na URL de callback. Verifique se as URLs de redirect estão configuradas corretamente no Supabase e Google Cloud Console.');
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao fazer login com Google';
      setError(errorMessage);
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  }, [getSupabaseClient, extractAuthParams, exchangeCodeForSession, saveSession]);


  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticating,
      error,
      signInWithGoogle,
      clearError,
    }),
    [isAuthenticating, error, signInWithGoogle, clearError]
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

