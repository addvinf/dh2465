import { createClient } from '@supabase/supabase-js';

export async function createSupabaseClientFromEnv() {
  console.log("process.env.SUPABASE_URL: " + process.env.SUPABASE_URL)
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || (!supabaseServiceRoleKey && !supabaseAnonKey)) {
    return null;
  }

  const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;
  const keyType = supabaseServiceRoleKey ? 'service_role' : (supabaseAnonKey ? 'anon' : 'none');
  try {
    console.log(`Supabase client: using ${keyType} key`);
  } catch (e) {
    // ignore logging issues
  }
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return supabase;
}


