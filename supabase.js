async function createSupabaseClientFromEnv() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || (!supabaseServiceRoleKey && !supabaseAnonKey)) {
    return null;
  }

  const supabaseModule = await import('@supabase/supabase-js');
  const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;
  const supabase = supabaseModule.createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return supabase;
}

module.exports = { createSupabaseClientFromEnv };


