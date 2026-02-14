const path = require('path');

const auth = require(path.join(process.cwd(), 'lib', 'auth'));

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get token from header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);
  const decoded = auth.verifyToken(token);

  if (!decoded || decoded.type !== 'user') {
    return res.status(401).json({ error: 'Invalid or unauthorized' });
  }

  // Lazy load database
  let pool;
  try {
    pool = require(path.join(process.cwd(), 'lib', 'db'));
  } catch (error) {
    console.error('Database module not available:', error.message);
  }

  if (!pool) {
    return res.json({
      leads: [],
      message: 'Database not configured',
    });
  }

  try {
    // Get user's leads (matching by email)
    const user = await auth.getUserById(decoded.id, 'user');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await pool.query(`
      SELECT 
        l.*,
        d.name as dealer_name,
        d.email as dealer_email,
        d.phone as dealer_phone
      FROM leads l
      LEFT JOIN dealers d ON l.dealer_id = d.id
      WHERE l.email = $1
      ORDER BY l.created_at DESC
    `, [user.email]);

    return res.json({
      leads: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching user leads:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      leads: [],
    });
  }
}
