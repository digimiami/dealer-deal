// Server-side Supabase client
// Use this in API routes and server components

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create client with anon key (for user operations)
export function createSupabaseClient(authToken = null) {
  const options = {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  };

  if (authToken) {
    options.global = {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    };
  }

  return createClient(supabaseUrl, supabaseAnonKey, options);
}

// Create admin client (for admin operations, bypasses RLS)
export function createSupabaseAdmin() {
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Get user from request (for API routes)
export async function getUserFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const supabase = createSupabaseClient(token);

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}
