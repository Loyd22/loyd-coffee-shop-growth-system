// Import the function that creates a Supabase client
import { createClient } from "@supabase/supabase-js";

// Get the Supabase project URL from the environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// Get the Supabase anon key from the environment variables
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);