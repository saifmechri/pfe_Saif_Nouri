import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseClient =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      })
    : null;

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    throw new Error("Supabase Realtime non configure (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).");
  }

  return supabaseClient;
};
