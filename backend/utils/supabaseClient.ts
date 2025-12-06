import { createClient } from "@supabase/supabase-js";
import { config } from "../config/env";

/**
 * Creates an authenticated Supabase client with user context
 * This allows RLS policies to work correctly by using auth.uid()
 *
 * @param accessToken - JWT access token from the authenticated user
 * @returns Supabase client configured with the user's token
 */
export function getAuthenticatedSupabaseClient(accessToken: string) {
  if (!accessToken) {
    throw new Error(
      "Access token is required to create authenticated Supabase client"
    );
  }

  if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
    throw new Error("Supabase URL or Anon Key is missing");
  }

  // Create client with global headers to pass token in all requests
  // This ensures RLS policies can access auth.uid() via the Authorization header
  const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      // Manually set the session using the access token
      storage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      },
    },
  });

  // Manually set the access token in the auth state
  // This is required for RLS policies to work correctly
  (supabase.auth as any)["_accessToken"] = accessToken;

  // Set session synchronously if possible
  // Using type assertion since we're manually setting up the session
  supabase.auth
    .setSession({
      access_token: accessToken,
      refresh_token: "",
    } as any)
    .catch(() => {
      // Ignore errors - header-based auth should work
    });

  return supabase;
}

