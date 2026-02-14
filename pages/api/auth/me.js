import { getUserFromRequest } from '../../../lib/supabase-server';
import { createSupabaseAdmin } from '../../../lib/supabase-server';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get user type from metadata
    const userType = user.user_metadata?.user_type || 'customer';
    const dealerId = user.user_metadata?.dealer_id || null;

    // Get additional user data from database
    const supabaseAdmin = createSupabaseAdmin();
    let userData = null;

    if (userType === 'dealer' && dealerId) {
      const { data, error } = await supabaseAdmin
        .from('dealer_accounts')
        .select('*, dealers(name)')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        userData = data;
      }
    } else {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        userData = data;
      }
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || userData?.name || user.email,
        type: userType,
        dealerId: dealerId,
        phone: userData?.phone || user.user_metadata?.phone || null,
      },
    });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}
