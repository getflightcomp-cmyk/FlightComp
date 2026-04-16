import { createClient } from '@supabase/supabase-js';

const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon   = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Public client — safe for browser; respects RLS (anon role).
export const supabase = createClient(supabaseUrl, supabaseAnon);

// Admin client — server-side only; bypasses RLS via service_role key.
export const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});
