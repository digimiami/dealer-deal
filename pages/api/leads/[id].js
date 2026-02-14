const path = require('path');
const pool = require(path.join(process.cwd(), 'lib', 'db'));

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const result = await pool.query(`
        SELECT 
          l.*,
          d.name as dealer_name,
          d.email as dealer_email,
          d.phone as dealer_phone
        FROM leads l
        LEFT JOIN dealers d ON l.dealer_id = d.id
        WHERE l.id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      return res.json({ lead: result.rows[0] });
    } catch (error) {
      console.error('Error fetching lead:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { status, notes, dealerId } = req.body;
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (status) {
        updates.push(`status = $${paramCount++}`);
        values.push(status);
      }

      if (notes !== undefined) {
        updates.push(`notes = $${paramCount++}`);
        values.push(notes);
      }

      if (dealerId) {
        updates.push(`dealer_id = $${paramCount++}`);
        values.push(dealerId);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id);

      const result = await pool.query(`
        UPDATE leads 
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
        RETURNING *
      `, values);

      return res.json({ lead: result.rows[0] });
    } catch (error) {
      console.error('Error updating lead:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
