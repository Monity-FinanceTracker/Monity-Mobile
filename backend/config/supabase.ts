import { createClient } from '@supabase/supabase-js';
import { config } from './env';

let supabase: any;
let supabaseAdmin: any;

try {
  if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
    throw new Error('Supabase URL or Anon Key is missing');
  }
  console.log('🔌 Initializing Supabase client...');
  supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
  
  if (config.SUPABASE_KEY) {
    supabaseAdmin = createClient(config.SUPABASE_URL, config.SUPABASE_KEY);
  } else {
    console.warn('⚠️ Supabase Admin Key missing - admin features will be disabled');
  }
} catch (error) {
  console.error('❌ Failed to initialize Supabase client:', error);
  // Exports remain undefined/null. Server.ts handles this safely.
}

export { supabase, supabaseAdmin };
