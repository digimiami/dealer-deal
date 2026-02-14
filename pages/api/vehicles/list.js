const path = require('path');
const pool = require(path.join(process.cwd(), 'lib', 'db'));

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      dealerId, 
      make, 
      model, 
      bodyType, 
      minPrice, 
      maxPrice, 
      minYear, 
      maxYear,
      fuelType,
      status = 'available',
      featured,
      limit = 20,
      offset = 0,
      search
    } = req.query;

    let query = `
      SELECT 
        v.*,
        d.name as dealer_name,
        d.email as dealer_email,
        d.phone as dealer_phone,
        d.territory as dealer_territory,
        COUNT(DISTINCT vm.id) as media_count,
        STRING_AGG(DISTINCT vm.url, ',') FILTER (WHERE vm.is_primary = true) as primary_image
      FROM vehicles v
      LEFT JOIN dealers d ON v.dealer_id = d.id
      LEFT JOIN vehicle_media vm ON v.id = vm.vehicle_id AND vm.media_type = 'image'
      WHERE v.status = $1
    `;

    const params = [status];
    let paramCount = 2;

    if (dealerId) {
      query += ` AND v.dealer_id = $${paramCount++}`;
      params.push(parseInt(dealerId));
    }

    if (make) {
      query += ` AND LOWER(v.make) = LOWER($${paramCount++})`;
      params.push(make);
    }

    if (model) {
      query += ` AND LOWER(v.model) = LOWER($${paramCount++})`;
      params.push(model);
    }

    if (bodyType) {
      query += ` AND LOWER(v.body_type) = LOWER($${paramCount++})`;
      params.push(bodyType);
    }

    if (minPrice) {
      query += ` AND v.price >= $${paramCount++}`;
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      query += ` AND v.price <= $${paramCount++}`;
      params.push(parseFloat(maxPrice));
    }

    if (minYear) {
      query += ` AND v.year >= $${paramCount++}`;
      params.push(parseInt(minYear));
    }

    if (maxYear) {
      query += ` AND v.year <= $${paramCount++}`;
      params.push(parseInt(maxYear));
    }

    if (fuelType) {
      query += ` AND LOWER(v.fuel_type) = LOWER($${paramCount++})`;
      params.push(fuelType);
    }

    if (featured === 'true') {
      query += ` AND v.featured = true`;
    }

    if (search) {
      query += ` AND (
        LOWER(v.make) LIKE LOWER($${paramCount}) OR
        LOWER(v.model) LIKE LOWER($${paramCount}) OR
        LOWER(v.description) LIKE LOWER($${paramCount})
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += `
      GROUP BY v.id, d.id
      ORDER BY v.featured DESC, v.created_at DESC
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    // Format results
    const vehicles = result.rows.map(vehicle => ({
      ...vehicle,
      features: vehicle.features || [],
      primary_image: vehicle.primary_image || null,
      media_count: parseInt(vehicle.media_count) || 0,
    }));

    return res.json({
      vehicles,
      count: vehicles.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
