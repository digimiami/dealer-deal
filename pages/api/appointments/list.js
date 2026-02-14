const path = require('path');

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
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
      appointments: [],
      count: 0,
      message: 'Database not configured',
    });
  }

  try {
    const { dealerId, leadId, status } = req.query;

    let query = `
      SELECT 
        tda.*,
        v.year, v.make, v.model, v.price,
        d.name as dealer_name
      FROM test_drive_appointments tda
      JOIN vehicles v ON tda.vehicle_id = v.id
      JOIN dealers d ON tda.dealer_id = d.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (dealerId) {
      query += ` AND tda.dealer_id = $${paramCount++}`;
      params.push(parseInt(dealerId));
    }

    if (leadId) {
      query += ` AND tda.lead_id = $${paramCount++}`;
      params.push(parseInt(leadId));
    }

    if (status) {
      query += ` AND tda.status = $${paramCount++}`;
      params.push(status);
    }

    query += ` ORDER BY tda.preferred_date DESC, tda.preferred_time DESC`;

    const result = await pool.query(query, params);

    return res.json({
      appointments: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      appointments: [],
      count: 0,
    });
  }
}
