// Server-side Supabase client for public (unauthenticated) reads.
// Uses the service-level anon key directly — no cookies, no SSR wrapper.
// Safe to use in Server Components for public data.
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export function createPublicClient() {
  return createClient(supabaseUrl, supabaseKey);
}
