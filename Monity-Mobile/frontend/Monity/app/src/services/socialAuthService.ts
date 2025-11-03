import * as AuthSession from "expo-auth-session";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Complete the auth session properly
WebBrowser.maybeCompleteAuthSession();

const SUPABASE_URL =
  Constants.expoConfig?.extra?.supabaseUrl ||
  "https://eeubnmpetzhjcludrjwz.supabase.co";
const SUPABASE_ANON_KEY =
  Constants.expoConfig?.extra?.supabaseAnonKey ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVldWJubXBldHpoamNsdWRyand6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MTI4MzQsImV4cCI6MjA2ODA4ODgzNH0.QZc4eJ4tLW10WIwhsu_p7TvldzodQrwJRnJ8LlzXkdM";

const AUTH_TOKEN_KEY = "auth_token";

export interface SocialAuthResult {
  success: boolean;
  session?: any;
  user?: any;
  error?: string;
}

/**
 * Login com Google usando OAuth do Supabase
 */
export async function signInWithGoogle(): Promise<SocialAuthResult> {
  try {
    // Criar cliente Supabase temporário
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });

    // Configurar redirect URL
    const redirectTo = AuthSession.makeRedirectUri({
      scheme: "monity",
      path: "auth/callback",
    });

    console.log("🔐 Iniciando login com Google, redirectTo:", redirectTo);

    // Iniciar OAuth flow do Supabase
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true, // Gerenciar redirect manualmente no React Native
      },
    });

    if (error) {
      console.error("❌ Erro ao iniciar login com Google:", error);
      return { success: false, error: error.message };
    }

    if (!data.url) {
      return { success: false, error: "URL de autenticação não disponível" };
    }

    console.log("🌐 Abrindo navegador para autenticação...");

    // Abrir o navegador para autenticação
    const authResult = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectTo
    );

    console.log("📱 Resultado da autenticação:", authResult.type);

    if (authResult.type !== "success") {
      if (authResult.type === "cancel") {
        return {
          success: false,
          error: "Autenticação cancelada pelo usuário",
        };
      }
      return {
        success: false,
        error: "Autenticação falhou ou foi cancelada",
      };
    }

    // Extrair o código da URL de retorno
    const { url } = authResult;
    console.log("📥 URL de retorno:", url);

    // Tentar extrair o código ou o token diretamente da URL
    try {
      const parsedUrl = new URL(url);
      const code = parsedUrl.searchParams.get("code");
      const errorCode = parsedUrl.searchParams.get("error");
      const accessToken = parsedUrl.searchParams.get("access_token");

      if (errorCode) {
        return {
          success: false,
          error: `Erro de autenticação: ${errorCode}`,
        };
      }

      // Se já temos o access_token na URL, usar diretamente
      if (accessToken) {
        // Buscar a sessão atual do Supabase
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError || !sessionData.session) {
          return { success: false, error: "Não foi possível obter a sessão" };
        }

        // Salvar o token
        const token = sessionData.session.access_token;
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);

        return {
          success: true,
          session: sessionData.session,
          user: sessionData.user,
        };
      }

      // Caso contrário, trocar o código por uma sessão
      if (code) {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (sessionError) {
          console.error("❌ Erro ao trocar código por sessão:", sessionError);
          return { success: false, error: sessionError.message };
        }

        if (!sessionData.session) {
          return { success: false, error: "Sessão não criada" };
        }

        // Salvar o token
        const token = sessionData.session.access_token;
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);

        return {
          success: true,
          session: sessionData.session,
          user: sessionData.user,
        };
      }

      // Se não encontrou código nem token, verificar se a sessão já foi criada
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        const token = sessionData.session.access_token;
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
        return {
          success: true,
          session: sessionData.session,
          user: sessionData.user,
        };
      }

      return { success: false, error: "Código de autenticação não encontrado" };
    } catch (parseError: any) {
      console.error("❌ Erro ao processar URL de retorno:", parseError);
      // Tentar obter a sessão diretamente do Supabase
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        const token = sessionData.session.access_token;
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
        return {
          success: true,
          session: sessionData.session,
          user: sessionData.user,
        };
      }
      return {
        success: false,
        error: "Erro ao processar resposta de autenticação",
      };
    }
  } catch (error: any) {
    console.error("❌ Erro no login com Google:", error);
    return {
      success: false,
      error: error.message || "Erro desconhecido ao fazer login com Google",
    };
  }
}

/**
 * Login com Apple (apenas iOS)
 */
export async function signInWithApple(): Promise<SocialAuthResult> {
  if (Platform.OS !== "ios") {
    return {
      success: false,
      error: "Apple Sign In está disponível apenas no iOS",
    };
  }

  try {
    // Criar cliente Supabase temporário
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });

    // Verificar se Apple Authentication está disponível
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      return {
        success: false,
        error: "Apple Sign In não está disponível neste dispositivo",
      };
    }

    console.log("🍎 Iniciando login com Apple...");

    // Solicitar credenciais do Apple
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      return {
        success: false,
        error: "Token de identidade não recebido da Apple",
      };
    }

    console.log("✅ Credencial recebida da Apple, autenticando no Supabase...");

    // Fazer login no Supabase com o token da Apple
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
      nonce: credential.nonce || undefined,
    });

    if (error) {
      console.error("❌ Erro ao fazer login com Apple no Supabase:", error);
      return { success: false, error: error.message };
    }

    if (!data.session) {
      return { success: false, error: "Sessão não criada" };
    }

    console.log("✅ Sessão criada com sucesso");

    // Salvar o token
    const token = data.session.access_token;
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);

    return {
      success: true,
      session: data.session,
      user: data.user,
    };
  } catch (error: any) {
    console.error("❌ Erro no login com Apple:", error);

    // Tratar cancelamento do usuário
    if (
      error.code === "ERR_REQUEST_CANCELED" ||
      error.code === "ERR_CANCELED" ||
      error.code === "1001" // Apple authentication cancel code
    ) {
      return {
        success: false,
        error: "Login cancelado pelo usuário",
      };
    }

    return {
      success: false,
      error: error.message || "Erro desconhecido ao fazer login com Apple",
    };
  }
}

