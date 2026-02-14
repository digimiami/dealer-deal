const path = require('path');
const pool = require(path.join(process.cwd(), 'lib', 'db'));

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { status, dealerId, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        l.*,
        d.name as dealer_name,
        d.email as dealer_email,
        d.phone as dealer_phone
      FROM leads l
      LEFT JOIN dealers d ON l.dealer_id = d.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND l.status = $${paramCount++}`;
      params.push(status);
    }

    if (dealerId) {
      query += ` AND l.dealer_id = $${paramCount++}`;
      params.push(parseInt(dealerId));
    }

    query += ` ORDER BY l.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);
    
    return res.json({
      leads: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
