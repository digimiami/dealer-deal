// Use require for CommonJS modules
const path = require('path');

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    // Lazy load database module
    let pool;
    try {
      pool = require(path.join(process.cwd(), 'lib', 'db'));
    } catch (error) {
      console.error('Database module not available:', error.message);
    }

    // If no database, return error
    if (!pool) {
      return res.status(503).json({ 
        error: 'Database not configured',
        message: 'Please set up PostgreSQL to view vehicle details.',
      });
    }

    try {
      // Get vehicle details with dealer info
      const vehicleResult = await pool.query(`
        SELECT 
          v.*,
          d.name as dealer_name,
          d.email as dealer_email,
          d.phone as dealer_phone,
          d.territory as dealer_territory,
          d.specialties as dealer_specialties
        FROM vehicles v
        LEFT JOIN dealers d ON v.dealer_id = d.id
        WHERE v.id = $1
      `, [id]);

      if (vehicleResult.rows.length === 0) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      const vehicle = vehicleResult.rows[0];

      // Get all media for this vehicle
      const mediaResult = await pool.query(`
        SELECT * FROM vehicle_media
        WHERE vehicle_id = $1
        ORDER BY is_primary DESC, display_order ASC, created_at ASC
      `, [id]);

      // Track view interaction
      const leadId = req.query.leadId || null;
      try {
        await pool.query(`
          INSERT INTO vehicle_interactions (vehicle_id, lead_id, interaction_type, ip_address, user_agent)
          VALUES ($1, $2, 'view', $3, $4)
        `, [id, leadId, req.headers['x-forwarded-for'] || req.connection?.remoteAddress, req.headers['user-agent']]);
      } catch (error) {
        console.error('Error tracking view:', error);
        // Don't fail the request if tracking fails
      }

      return res.json({
        vehicle: {
          ...vehicle,
          features: vehicle.features || [],
          dealer_specialties: vehicle.dealer_specialties || [],
          media: mediaResult.rows,
          price: parseFloat(vehicle.price),
          mileage: parseInt(vehicle.mileage) || 0,
        },
      });
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
