import { createSupabaseClient } from '../../../lib/supabase-server';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const validatedData = loginSchema.parse(req.body);
    const supabase = createSupabaseClient();

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (error) {
      return res.status(401).json({
        error: error.message || 'Invalid credentials',
      });
    }

    if (!data.session || !data.user) {
      return res.status(401).json({
        error: 'Failed to create session',
      });
    }

    // Get user metadata to determine type
    const userType = data.user.user_metadata?.user_type || 'customer';
    const dealerId = data.user.user_metadata?.dealer_id || null;

    return res.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email,
        type: userType,
        dealerId: dealerId,
      },
      session: data.session,
      message: 'Login successful',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}
