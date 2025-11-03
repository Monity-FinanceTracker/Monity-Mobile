import { createClient } from '@supabase/supabase-js';
import { config } from './env';

const supabase = createClient(config.SUPABASE_URL!, config.SUPABASE_ANON_KEY!);
const supabaseAdmin = createClient(config.SUPABASE_URL!, config.SUPABASE_KEY!);

export { supabase, supabaseAdmin };
