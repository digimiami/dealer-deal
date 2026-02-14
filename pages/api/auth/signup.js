import { createSupabaseAdmin } from '../../../lib/supabase-server';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2).max(255),
  phone: z.string().optional(),
  userType: z.enum(['customer', 'dealer']).default('customer'),
  dealerId: z.number().optional(),
});

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const validatedData = signupSchema.parse(req.body);
    const supabaseAdmin = createSupabaseAdmin();

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: true, // Auto-confirm email (or set to false for email verification)
      user_metadata: {
        name: validatedData.name,
        phone: validatedData.phone || null,
        user_type: validatedData.userType,
        dealer_id: validatedData.dealerId || null,
      },
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('Failed to create user');
    }

    // Create user record in database
    if (validatedData.userType === 'dealer') {
      if (!validatedData.dealerId) {
        // Delete the auth user if dealer ID is missing
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return res.status(400).json({ error: 'Dealer ID is required for dealer signup' });
      }

      // Insert into dealer_accounts table
      const { error: dbError } = await supabaseAdmin
        .from('dealer_accounts')
        .insert({
          dealer_id: validatedData.dealerId,
          email: validatedData.email,
          name: validatedData.name,
          user_id: authData.user.id, // Link to Supabase auth user
        });

      if (dbError) {
        // Delete the auth user if database insert fails
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw new Error(dbError.message);
      }
    } else {
      // Insert into users table
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .insert({
          email: validatedData.email,
          name: validatedData.name,
          phone: validatedData.phone || null,
          user_id: authData.user.id, // Link to Supabase auth user
        });

      if (dbError) {
        // Delete the auth user if database insert fails
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw new Error(dbError.message);
      }
    }

    // Sign in the user to get session
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (sessionError || !sessionData.session) {
      return res.status(201).json({
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: validatedData.name,
          type: validatedData.userType,
        },
        message: 'Account created successfully. Please sign in.',
      });
    }

    return res.status(201).json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: validatedData.name,
        type: validatedData.userType,
      },
      session: sessionData.session,
      message: 'Account created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Signup error:', error);
    return res.status(400).json({
      error: error.message || 'Failed to create account',
    });
  }
}
