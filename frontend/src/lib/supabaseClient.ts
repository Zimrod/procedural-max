// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Fallback to your project credentials if environment variables aren't loaded yet
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing. Ensure your environmental variables are set up.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);