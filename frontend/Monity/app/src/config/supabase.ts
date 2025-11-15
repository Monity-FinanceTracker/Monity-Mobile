import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Configuration
const SUPABASE_URL =
  Constants.expoConfig?.extra?.supabaseUrl ||
  'https://eeubnmpetzhjcludrjwz.supabase.co';
const SUPABASE_ANON_KEY =
  Constants.expoConfig?.extra?.supabaseAnonKey ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVldWJubXBldHpoamNsdWRyand6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MTI4MzQsImV4cCI6MjA2ODA4ODgzNH0.QZc4eJ4tLW10WIwhsu_p7TvldzodQrwJRnJ8LlzXkdM';

// Export constants for use in other files
export { SUPABASE_URL, SUPABASE_ANON_KEY };

// Singleton Supabase client instance
let supabaseInstance: SupabaseClient | null = null;

/**
 * Get or create the centralized Supabase client instance.
 * This ensures we have a single source of truth for authentication state.
 */
export const getSupabase = (): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return supabaseInstance;
};

/**
 * Reset the Supabase client instance (useful for testing or logout scenarios).
 */
export const resetSupabaseInstance = () => {
  supabaseInstance = null;
};

// Export the singleton instance directly for convenience
export const supabase = getSupabase();
