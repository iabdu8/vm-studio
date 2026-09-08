import { createClient } from "@supabase/supabase-js";

// Set these in your .env file:
// VITE_SUPABASE_URL=https://xxxx.supabase.co
// VITE_SUPABASE_ANON_KEY=eyJ...

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigError = (!supabaseUrl || !supabaseKey)
  ? "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env"
  : null;

export const supabase = supabaseConfigError ? null : createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken:  true,
    persistSession:    true,
    detectSessionInUrl:true,
  },
});

export function requireSupabase() {
  if (!supabase) throw new Error(supabaseConfigError);
  return supabase;
}
