const path = require('path');
const pool = require(path.join(process.cwd(), 'lib', 'db'));

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { active, specialty } = req.query;
    
    let query = 'SELECT * FROM dealers WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (active !== undefined) {
      query += ` AND active = $${paramCount++}`;
      params.push(active === 'true');
    }

    if (specialty) {
      query += ` AND $${paramCount} = ANY(specialties)`;
      params.push(specialty);
    }

    query += ' ORDER BY priority DESC, name ASC';

    const result = await pool.query(query, params);
    
    return res.json({
      dealers: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching dealers:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
